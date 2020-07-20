#!/usr/bin/perl -w
use CGI qw/:standard/;
use POSIX ();
use Cwd;

print header();
print start_html("kill_this_ntuple_server.cgi");

# kill any existing service, if PID file exists.
#Find the process with a name that matches the username I inferr
#Inferred username was stuffed into $1 by the regular expression
#match on the previous line.
#I'm finding the ntuple server by port number.  So, the next line needs to change if you want to use it with other Arachne instances.
my $port = 9095; #Standard Arachne instance DST server
open IN, "pgrep -f \"^\.\./ntuple_server/ntuple-server -p $port\"  2> /dev/null |"; #redirection (2>) sliences STDERR

if($pid = <IN>) #N.B.: If there are multiple matching processes,
                #      this will only ever kill the first one!
{
  chomp $pid; #Remove newline
} else { #If there are no SystemTestsApp.exe processes that were started from $1's area
  print "<br/>There is no running DST server no port $port!\n";
  print "There's probably something else wrong with Arachne like a log file being full after dCache maintanence.\n";
  print "Please contact a MINERvA computing expert like Andrew.\n";
}

#If I've got the PID of a server to kill, kill it and try to reload the previous page.
if(defined($pid))
{
  kill &POSIX::SIGHUP, $pid;

  #Restart Arachne TWICE.
  my $homePage = ""; #TODO: Actually get the previous page I was on.  I'm really worried about getting the event number right

  sleep 2; #Give the process at $pid time to be killed
  print "<br/>Now, I'm reloading Arachne the first time for you.\n";
  print "<br/>This will take about 10 seconds.  Once you get redirected back to Arachne, students can continue the exercise.\n";
  print "<br/>Please contact a MINERvA computing expert if this doesn't work.\n";
  #The line below forces Arache to reload the first time.  I learned from
  #a second-hand email from Phil that we have to reload Arachne
  #twice after taking the server down.  I'm putting Arachne in a 0-size iframe
  #to force it to load without displaying anything.
  #I learned to make a 0-size iframe from https://stackoverflow.com/questions/25435089/html-hide-an-iframe/25435121
  #FIXME: I read somewhere that 0-size iframes might look like malware.  Someone who knows more than me about web design
  #       should probably look into that.
  print "<iframe src=\"$homePage\" style=\"visibility: hidden;\"></iframe>";
  print "<meta http-equiv=\"refresh\" content=\"5;$homePage\" />"; #Thank you StackOverflow: https://stackoverflow.com/questions/3292038/redirect-website-after-certain-amount-of-time
} else { #If I failed to find a server to kill, there's a more serious problem.
  print "<br/>Failed to find the process ID to kill!\n";
  print "This needs expert attention.  Please contact a MINERvA computing expert.\n";
}

print end_html;
