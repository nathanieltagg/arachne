#!/usr/bin/perl -w

# to run this, start a server in another window on port 9099

use Cwd;
use ArachneServerTools;
use Time::HiRes;

$data_glob = "*_DST*.root "
. "/minerva/data/online_processing/swap_area/NearlineCurrentNumibDST.root "
. "/minerva/data/online_processing/swap_area/*_numi*DST.root "
. "/minerva/data/users/minerva/data_processing/dst/*_DST*.root "
. "/minerva/data/data_processing/minerva/dst/numip/v7r5p1_DEV_20100724/*/*/*/*/*_DST*.root "
;

@rawfiles = glob($data_glob);
@files = ();
foreach $f (@rawfiles)
{
  if( $f=~/Linjc/ ) { next; }
  push @files,$f;
}


while(1) {
  
$fileno = int(rand(@files));
$file = $files[$fileno];
# $file = "TB_00000227_0003_bonly_v07_100a6261319_FullChain_DST_v8r0_DEV.root";
$entry = int(rand(200));
$options = "-";
#if(rand(1)>0.5) 
#{
$options = "+REFRESH";
#}

$ArachneServerTools::ntuple_server_port = 9099;

print "_______________________________________________________________________________________\n";
my $sock = ArachneServerTools::get_sock();
$sock || die("Socket wouldn't open.");
print "Requesting $options,$file,1,$entry,0\n";

print $sock "$options,$file,1,$entry,0\n";
my $start = Time::HiRes::gettimeofday();

my $timeout_seconds = 3;

$sel = IO::Select->new();
$sel->add($sock);
@ready = $sel->can_read($timeout_seconds);
if(@ready) {
  $result = "";
  while(<$sock>) {
    $result .= $_;
  }
  my $end = Time::HiRes::gettimeofday();
  print "Got result from ntuple-server. Length: " . length($result) . " bytes\n";
  printf("Elapsed time: %.2f\n", $end - $start);
  if($result =~ /<error>/ ) {
    print $result."\n";
    print "Caught error.\n";
    # die "Caught error.";
  }
  if(length($result)<10) {
    print $result."\n";
    die "Result too small.";    
  }
} else {
  die("Socket timeout.")
}

undef $sock;

}
