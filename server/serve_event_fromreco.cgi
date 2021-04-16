#!/usr/bin/perl -w
use CGI qw/:standard/;
use POSIX qw(setsid);
use ArachneServerTools qw(setup myerror);
use URI::Escape;
use English; # How you can tell that Phil edited this file?
use File::Basename;
#
# Script to get a an event from a reco POOL file as json
# 
# Talks to an event server [TODO: sensible name and description]
#

$ArachneServerTools::ntuple_server_port = 9090;
$ArachneServerTools::ntuple_server_host = 'localhost';
$ArachneServerTools::exec_name = 'ntuple-server-reco.sh';
$ArachneServerTools::file_type = 'reco';


ArachneServerTools::setup();

my $pathglob ="";
my $fileglob = "";
my $selection = "1";
my $entrystart = 0;
my $entryend = 1000000000;
my $filename="";
my $gate=-1;

if(defined param('entry')) {
    $entrystart=param('entry');
}

# TODO: This is possibly wrong
if(defined param('gate')) {
    $gate=param('gate');
}



if(defined param('filename')){
    # Requested a file by name
    $filename=uri_unescape(param('filename'));
    print "Request for filename $filename\n";
} 
else
{
    # Requested a specific run, subrun, gate
    # from official DSTs.
    if( defined param('run')    ) {$run = param('run');       }
    if( defined param('subrun') ) {$subrun = param('subrun'); }
    if( defined param('ver')    ) {$ver = param('ver'); }
    if( defined param('det')    ) {$det = param('det'); }
}


if(!defined param('filename')) {  # Don't cut if we specifically requested the file.

    # Now put together the dimensions string
    # Map the detector type to the SAM data tier
    my %data_tiers=(
	"MV"          => "reconstructed-pool",
	"MN"          => "reconstructed-pool",
	"SIM_minerva" => "mc-reco-pool",
	"SIM_frozen"  => "mc-reco-pool"
	);
    # Map detector type to run_type
    my %run_types=(
	"MV"          => "minerva",
	"MN"          => "downstream",
	"SIM_minerva" => "minerva",
	"SIM_frozen"  => "downstream"
	);

    if( defined param('run')    ) {$run = param('run');       }
    if( defined param('subrun') ) {$subrun = param('subrun'); }
    if( defined param('ver')    ) {$ver = param('ver'); }
    if( defined param('det')    ) {$det = param('det'); }
    
    my $dims="run_number ${run}.${subrun} and version $ver and data_tier $data_tiers{$det} and run_type $run_types{$det}";
    if($det =~ /^SIM/){ $dims .= " and mc.mcgeneratorvariationtag central_value and mc.mccalvariationtag central_value"; }

    if($ver eq "eroica"){
	$dims="run_number ${run}.${subrun} and version like \"v10r8p%\" and data_tier $data_tiers{$det} and run_type $run_types{$det}";
	if($det =~ /^SIM/){ $dims .= " and mc.mcgeneratorvariationtag central_value and mc.mccalvariationtag central_value"; }
	$dims .= " minus (version v10r8p1 or version v10r8p2 or version v10r8p3)";
    }
    if($ver eq "inextinguishable"){
	$dims="run_number ${run}.${subrun} and version v21r1p1 and data_tier $data_tiers{$det} and run_type $run_types{$det}";
	if($det =~ /^SIM/){ $dims .= " and mc.mcgeneratorvariationtag central_value and mc.mccalvariationtag central_value"; }
    }
    print "dims is $dims\n";

    chomp(my $ifdh = `sh -c ./get_ifdh_path.sh`);
    print "Before translateConstraints, ifdh is $ifdh\n";

    my @files_ifdh;
    # This is apparently a safe(r) way to do backticks, since we're using input from outside. From:
    # http://docstore.mik.ua/orelly/perl/prog/ch06_03.htm
    # Basically, we open a child process by forking, and talk to the child
    die unless defined($pid = open(KID, "-|"));
    if ($pid) {
	# We're in the parent process: get the output from the child
	while (<KID>) {
	    chomp;
	    print "ifdh returned candidate $_\n";
	    # The filename has to begin with the det string. It
	    # sometimes doesn't when the SAM metadata is b0rked
	    print "Trying to match against det=$det: ";
	    print m/^$det/;
	    print "\n";
	    if($_ =~ /^$det/){ push @files_ifdh, $_ };
	}
	print "ifdh returned $#files_ifdh files\n";
	close KID;
    }
    else {
	chomp (my $ifdh = `sh -c ./get_ifdh_path.sh`);
	# We're in the child process: run ifdh to get the list of files
	# First set up ifdh
	$ENV{"EXPERIMENT"}="minerva";
	# Calling exec with a list means that no shell is invoked,
	# so we're less vulnerable to shell injection, apparently
	exec $ifdh, "translateConstraints", "$dims";
	ArachneServerTools::myerror("Failed running $ifdh $!");
    }

    if(! @files_ifdh ){
	ArachneServerTools::myerror("Couldn't find file for dimensions \"$dims\"");
    }
    else{
	# TODO: Using backticks directly here. I think this is
	# safe because we're using the output of ifdh as input,
	# but maybe we should do the forking dance again

	chomp(my $ifdh = `sh -c ./get_ifdh_path.sh`);
	print "Before locateFile, ifdh is $ifdh\n";
	$ENV{"EXPERIMENT"}="minerva";

	my $cmd="$ifdh locateFile $files_ifdh[0]";
	print "Running $cmd\n";
	#system($cmd);
	my $dirname = `$cmd`;
	# Remove any trailing newlines. Sadly chomp() only removes one newline, and there can be many
	$dirname =~ s/\s+$//;
	# ifdh locateFile returns a location like
	# "enstore:/the/actual/path(useless@useless)" so we have
	# to demangle it
	$dirname =~ s/enstore://;
	$dirname =~ s/\(.*$//;
	# Add the filename back on: ifdh locateFile only gave us the directory
	$filename = "$dirname/$files_ifdh[0]";

	chomp( $filename );
    }
}

if(! $filename || !(-r $filename || $filename =~ m/^(dcap):/)) {
    ArachneServerTools::myerror("Couldn't find file \"$filename\"");
}

if($filename =~ /^\/pnfs/ && $filename !~ /^\/pnfs\/minerva\/(persistent|scratch)/){
#if(0) { #TODO: Put this back when dCache stops misbehaving.  aolivier on Feb. 16, 2021 #NOTE: Use this line when dCache misbehaves ;) Alex on 02/17/21
    # Use pnfs magic to see whether the file is in the disk
    # cache. If it's not, we'd hang waiting for the tape
    # robot. So just refuse to get it
    my $dirname = dirname($filename);
    my $basename = basename($filename);
    my $pnfsmagicfilename = "$dirname/.(get)($basename)(locality)";
    print "Checking pnfs magic file $pnfsmagicfilename\n";
    open(my $pnfsmagicfile, "<", $pnfsmagicfilename);
    if(!(<$pnfsmagicfile> =~ /ONLINE/)){
	ArachneServerTools::myerror("It looks like $filename is only on tape and not on disk, so it'll take ages to get. I'm not going to try. Ask on the software list how to prestage the files you want");
    }
}
else{
    print "No need to check onlineness for $filename\n";
    print "Matches pnfs at start? ";
    print $filename =~ /^\/pnfs/;
    print "\n";
    print "Isn't persistent or scratch? ";
    print $filename !~ /^\/pnfs\/minerva\/(persistent|scratch)/;
    print "\n";
}
my $resp = ArachneServerTools::request($filename,$selection,$entrystart,$entryend,"",$gate);

ArachneServerTools::serve($resp);
