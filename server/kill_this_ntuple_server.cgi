#!/usr/bin/perl -w
use CGI qw/:standard/;
use POSIX ();
use Cwd;

print header();
print start_html("kill_this_ntuple_server.cgi");

print "Processes before I killed anything:\n";
print "<pre>";
system("ps aux | grep ntuple-server");
print "</pre>";

# kill any existing service, if PID file exists.
my $pidFileName = "ntuple-server-reco.pid";
if(-r $pidFileName) {
	open PIDFILE,"<$pidFileName";
	$pid = <PIDFILE>;
	close PIDFILE;
        unlink "$pidFileName";
} else { #Alternate way to figure out what PID to kill
  #Infer server by Cwd() instead.
  my $pwd = getcwd;
  if($pwd =~ ".*/home/([^/]+)/.*")
  {
    #Find the process with a name that matches the username I inferr
    #Inferred username was stuffed into $1 by the regular expression
    #match on the previous line.
    open IN, "pgrep -f \"^SystemTestsApp.exe .*/$1/.*\"  2> /dev/null |"; #redirection (2>) sliences STDERR
  
    if($pid = <IN>) #N.B.: If there are multiple matching processes,
                    #      this will only ever kill the first one!
    {
      chomp $pid; #Remove newline
    } else { #If there are no SystemTestsApp.exe processes that were started from $1's area
      print "<br/>There is no running NTuple server that was started from a directory owned by $1!\n";
      print "There's probably something else wrong with Arachne like a log file being full after dCache maintanence.\n";
      print "Please post this message on the MINERvA computing Slack channel or contact a MINERvA computing expert like Andrew.\n";
    }
  }
  else { #If the pwd doesn't contain /home/<some user's name>/
    print "<br/>I can't infer the NTuple server name from the current working directory: $pwd\n";
    print "Please post this message on the MINERvA computing Slack channel or contact a MINERvA computing expert like Andrew.\n";
  }
}

#If I've got the PID of a server to kill, kill it and try to reload the previous page.
if(defined($pid))
{
  kill &POSIX::SIGHUP, $pid;

  #Restart Arachne TWICE.
  my $homePage = "../arachne_test_reboot.html"; #"https://minerva05.fnal.gov/Arachne/arachne_test_reboot.html"; #TODO: Actually get the previous page I was on.  I'm really worried about getting the event number right

  sleep 2; #Give the process at $pid time to be killed
  print "<br/>Killed the process with PID = $pid.\nNow, I'm reloading Arachne the first time for you.\n";
  #The line below forces Arache to reload the first time.  I learned from
  #a second-hand email from Phil that we have to reload Arachne
  #twice after taking the server down.  I'm putting Arachne in a 0-size iframe
  #to force it to load without displaying anything.
  #I learned to make a 0-size iframe from https://stackoverflow.com/questions/25435089/html-hide-an-iframe/25435121
  #FIXME: I read somewhere that 0-size iframes might look like malware.  Someone who knows more than me about web design
  #       should probably look into that.
  print "<iframe src=\"$homePage\" style=\"visibility: hidden;\"></iframe>";
  print "<br/>Please wait ~10 seconds and then go back to the previous page.  Upon reloading, Arachne should be working again.  One more refresh might help.\n";
  #print "<meta http-equiv=\"refresh\" content=\"5;url=javascript:history.back()\" />"; #Thank you StackOverflow: https://stackoverflow.com/questions/3292038/redirect-website-after-certain-amount-of-time
} else { #If I failed to find a server to kill, there's a more serious problem.
  print "<br/>Failed to find the process ID to kill!\n";
  print "This needs expert attention.  Please contact a MINERvA computing expert or post on the MINERvA Slack computing channel.\n";
}

print end_html;
