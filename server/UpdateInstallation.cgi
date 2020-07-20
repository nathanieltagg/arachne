#!/usr/bin/perl -w
use CGI qw/:standard/;
use CGI::Carp qw/fatalsToBrowser warningsToBrowser/;

#
# Script to get a an event from a root-file DST as an XML object.
# 
# This version simply launches a ROOT session to do it's bidding, which is not
# the fastest - better would be to send a query to a running server
# which would not need to launch (or even open files in some cases).

print header;

print p("Updating sources via svn.");

print "<pre>";
$cmd = "pwd; ./UpdateViaSvn.sh 2>&1";
print $cmd . "\n";
system ($cmd);
print "</pre>";

print p("Rebuilding server.");
print "<pre>";
$cmd = "source ~tagg/.bash_profile; cd ../ntuple_server; make";
system ($cmd);
print "</pre>";

print p("Killing server.");
print "<pre>";

print "BEFORE: -------- \n";
system("ps aux | grep ntuple-server");

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
  $cmd='/usr/bin/killall -s SIGKILL -v ntuple-server';
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
    unlink "ntuple-server.log";
  } else {
    print "No PID supplied. Use ?all or ?pid=xxxx to specify a kill target.\n\n";
  }
}

sleep(2);
print "\n\nAFTER: -------- \n";
system("ps aux | grep ntuple-server");


print "</pre>";
print end_html;