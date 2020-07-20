#!/usr/bin/perl -w
use CGI qw/:standard/;
use POSIX ();

print header();

print start_html("kill_ntuple_server.cgi");
print "<pre>";

print "BEFORE: -------- \n";
system("ps aux | grep ntuple-server-reco");

print "\n\n";

# kill any existing service, if PID file exists.
if(-r "ntuple-server.pid") {
	open PIDFILE,"<ntuple-server.pid";
	$pid = <PIDFILE>;
	close PIDFILE;
	print "PID file exists - had pid $pid \n";
        print "Deleting PID file.";
        unlink "ntuple-server.pid";
}


if(defined param('all')) {
  $cmd='/usr/bin/killall -s SIGKILL -v ntuple-server-reco.sh';
  print "Running $cmd";
  system($cmd);
} else {
  if( defined param('pid') ) {
    $pid = param('pid');
    print "Using supplied pid $pid \n";
  }

  if(defined($pid)) {
    print "Trying to kill pid $pid\n";
  #  print("kill -s SIGKILL $pid \n");
  #  system('kill -s SIGKILL $pid');
    kill &POSIX::SIGHUP, $pid;
    print "done \n";
    unlink "ntuple-server.pid";
  } else {
    print "No PID supplied. Use ?all or ?pid=xxxx to specify a kill target.\n\n";
  }
}

sleep(2);
print "\n\nAFTER: -------- \n";
system("ps aux | grep ntuple-server-reco");


print "</pre>";
print end_html;
