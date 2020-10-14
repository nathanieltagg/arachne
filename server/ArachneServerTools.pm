#!/usr/bin/perl -w

package ArachneServerTools;

use Time::HiRes qw( gettimeofday tv_interval );
use CGI qw/:standard/;
use POSIX qw(setsid);
use IO::Socket;
use IO::Select;
use Cwd;
use Encode qw(encode_utf8);
use JSON::XS qw(encode_json);
use Exporter 'import';

@EXPORT = qw(setup myerror serve request); # symbols to export


our $ntuple_server_port = 9090;
our $ntuple_server_host = 'localhost';
our $exec_name = 'ntuple-server-reco.sh';
our $file_type = 'reco';

do("../config/server_config.pl"); #|| die; # load file if present.



our $msglog;
our $oldout;
our $olderr;

sub setup
{
  # Before we begin, capture all the usual stdout stuff and stuff it into a variable, so we can ship it inside the JSON.
  open($oldout, ">&STDOUT") or die "Can't dup STDOUT: $!";;
  open($olderr, ">&STDERR") or die "Can't dup STDERR: $!";;
  close STDOUT;
  open(STDOUT, ">", \$msglog);
  open(STDERR, ">", \$msglog);
  print "testing\n";
}



sub serve
{
  # print to the stored version of $stdout to actually get it out the door.
  # Note that we encode everything that nominally went to stdout/stderr and ship it as the 'serve_event_log'.

  print $oldout header(-type => 'application/json',
               -Access_Control_Allow_Origin => "*");
  print $oldout '{';
  print $oldout '"record":';
  print $oldout @_;
  # Convert $msglog to something printable in html.
  $msglog =~ s/\n/\<br\/\>/g;
  print $oldout ',"serve_event_log":"';
  print $oldout encode_utf8 "$msglog";
  print $oldout '"}';
}


# subroutine to print errors to xml stream

sub myerror
{
  # subroutine to print errors to json stream
  print $oldout header(-type => 'application/json',
               -Access_Control_Allow_Origin => "*");
  my $err = shift();
  print $oldout encode_json({serve_event_log=> $msglog, error => $err});
  exit;
}

sub kill_running_server
{
  print "Killing any running ntuple-server process.\n";
  # kill any existing service, if PID file exists.
  if( -r "ntuple-server-${file_type}.pid" ) {
      my $pid = `cat ntuple-server-${file_type}.pid`;
      print "Found pid file with value $pid \n";
      unless(kill(9,$pid))
      {
        print "Could not signal that process. Deleting its pid file\n";
        unlink "ntuple-server-${file_type}.pid";
      }
      sleep(3);
      if(kill(0,$pid)) {
        print "The process still freaking exists. I don't know how to kill it.\n"
      } else {
        print "Looks like it's dead, Jim.\n";
      }
  }

}

sub start_server
{
  print "Starting up a new ntuple-server process.\n";
  # fork off a new process.
  my $pid = fork();

  if(not defined $pid) {
      myerror("couldn't fork!");
  } elsif($pid==0) {
    # This is the forked process.

      if($file_type=='dst'){
          $ROOTSYS="../ntuple_server/root";
          $ENV{"ROOTSYS"}="$ROOTSYS";
          $ENV{"LD_LIBRARY_PATH"}="$ROOTSYS/lib";
      }

      setsid();
      rename "ntuple-server-${file_type}.log.4", "ntuple-server-${file_type}.log.5";
      rename "ntuple-server-${file_type}.log.3", "ntuple-server-${file_type}.log.4";
      rename "ntuple-server-${file_type}.log.2", "ntuple-server-${file_type}.log.3";
      rename "ntuple-server-${file_type}.log.1", "ntuple-server-${file_type}.log.2";
      rename "ntuple-server-${file_type}.log", "ntuple-server-${file_type}.log.1";
      unlink "ntuple-server-${file_type}.log";
      open STDIN,  '</dev/null';
      open STDOUT, ">ntuple-server-${file_type}.log";
      open STDERR, '>&STDOUT';
  #     my $pid = getppid();
  #     # system("echo $pid > ntuple-server.pid");
  #     # my $pwd = getcwd;
  #     # system("echo $pwd >> ntuple-server.pid");
      #print  $pwd . "\n";

      # This is ugly: the reco file-based server needs a wrapper
      # script to set up the minerva software, so the ntuple server is
      # a shell script that we have to run via sh. But the DST-based
      # server is a real executable that we run directly. Oh well
      my $cmd = "sh -c \"../ntuple_server/$exec_name $ntuple_server_port\" >> ntuple-server-${file_type}.log 2>&1";
      if($file_type eq 'dst'){
          $cmd = "../ntuple_server/$exec_name -p $ntuple_server_port >> ntuple-server-${file_type}.log 2>&1";
      }
      print  "Running: $cmd<br/>\n";
      $val = system($cmd);
      $pid = $!;
      # unlink "ntuple-server-${file_type}.pid";
      exit($val);
  }
}


sub get_sock
{
  my $sock = new IO::Socket::INET(
    PeerAddr => $ntuple_server_host,
    PeerPort => $ntuple_server_port,
    Proto => 'tcp',
    );

  if(!$sock) {
    print "get_sock() error: $!\n";
  }

  return $sock;
}

# Guess the reco version based on the file path. Look for v*r*(p*) and
# return the last one, since the version usually occurs in both the
# path and in the filename - we'll believe the filename over the path
sub guess_version
{
    my $filename=$_[0];
    my @vers;
    while($filename =~ m/(v[0-9]+r[0-9]+(p[0-9]+)?)/g){
        #print "$1\n";
        push @vers, $1;
    }
    if(@vers){
        return $vers[-1];
    }
    else{
        # We didn't match a version string in the filename
        return "unknown";
    }
}

sub request
{
  my $time_start = [gettimeofday];
  my $filename = shift() || "NO_FILENAME_SPECIFIED";
  my $selection = shift() || 1;
  my $entrystart = shift() || 0;
  my $entryend = shift() || 0;
  my $options = shift() || "-";
  my $gate = shift() || -1;

  #Cover up some possible blanks by user or upstream error.
  if($entrystart eq "") { $entrystart = "0"; };
  if($selection eq "") { $selection = "1"; };
  if($entryend eq "") { $entryend = "0"; };
  if($gate eq "") { $gate = "-1"; };


  print "<br/>MyArachneServerTools::request() $filename $selection $entrystart $entryend $options\n<br/>";
  print "From host: $ntuple_server_host port $ntuple_server_port with $exec_name\n<br/>";


  #Is there an open root session?
  my $sock = get_sock();

  RESTART:

  if(! $sock) {
    # wait and try again once.
    sleep(20);
    undef $sock;
    $sock = get_sock();
  }
  if(! $sock) {
    kill_running_server();
    start_server();

    sleep(20);

    print "Looking for socket on newly restarted process.\n";
    my $startup_timeout_tries = 1;

    my $startup_time = 0;
    while($startup_time < $startup_timeout_tries) {
      sleep(3);
      undef $sock;
      $sock = get_sock();
      last if ($sock); # exit if we have it.
      print "incrementing startup_time from $startup_time\n";
      $startup_time++;
    }

    print "Finished looking for socket. Do I have it?\n";
    if($sock) {print "Yes\n";}
    else {print "No.\n";}

    myerror("Could not create socket\n") unless $sock;
  }


  # Another wart: if a gate number is specified, the DST-based system
  # deals with it by adding ev_gate==x to the selection, but the reco
  # file server has to have it passed as another option in the string
  # sent on the socket

  if($file_type eq 'dst'){
      print  "$options,$filename,$selection,$entrystart,$entryend\n";
      print $sock "$options,$filename,$selection,$entrystart,$entryend\n";
  }
  else{
      print "$options,$filename,$selection,$entrystart,$entryend,$gate\n";
      print $sock "$options,$filename,$selection,$entrystart,$entryend,$gate\n";
  }

  print "Query made.\n";

  # now wait to see if we get anything on the socket
  my $timeout_seconds = 100;

  $sel = IO::Select->new();
  $sel->add($sock);

  @ready = $sel->can_read($timeout_seconds);
  if(@ready) {
    $result = "";
    while(<$sock>) {
      $result .= $_;
    }
    print "Got result from ntuple-server. Length: " . length($result) . " bytes\n<br/>";
    print "Time to get response: " . tv_interval( $time_start, [gettimeofday])*1000 . " ms\n<br/>";

    if($file_type ne 'dst'){
        # The reco file backend returns the reco version as v10r6
        # always, so we replace it with a value guessed from the
        # filename
        my $guessedversion=guess_version($filename);
        $result =~ s/"reco_version":"v10r6"/"reco_version":"${guessedversion}"/;
    }

    return $result;
  } else {
    #looks like the server had problems. restart.
    undef $sock;
    print "The server took longer than timeout ($timeout_seconds) to give a response, so I'm restarting the process.\n";

    goto RESTART;
  }

}

1;
