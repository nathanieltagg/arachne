#!/usr/bin/perl -w

use CGI qw/:standard/;
use POSIX qw(setsid);
use IO::Socket;
use Cwd;
use Data::Dumper;
use update_live_cache;
use ArachneServerTools qw(setup myerror);

$ArachneServerTools::ntuple_server_port = 9095;
$ArachneServerTools::ntuple_server_host = 'localhost';
$ArachneServerTools::exec_name = 'ntuple-server';
$ArachneServerTools::file_type = 'dst';

ArachneServerTools::setup();

if( -r "server_config.pl" ) {
   require "server_config.pl";
} 

update_live_cache::update();

# look at the available cached files.
@cachefiles = glob("live_event_cache/*.json");
# Sort by filename
@cachefiles = reverse sort @cachefiles;
for $f (@cachefiles) {
  print $f . "\n";
}
# print Dumper(@cachefiles);
$most_recent_cachefile = $cachefiles[0];
my $filename = $most_recent_cachefile;   #default: go for the most up-to-date.

# Check request params.
if(defined param('latest_cache') && defined param('recent_cache')) {
  $latest_cache = param('latest_cache');   #timestamp of the latest event yet seen by that client
  $recent_cache = param('recent_cache'); #timestamp of the event they were just looking at.

  # Has a new event come along since we last looked?
  if($most_recent_cachefile gt $latest_cache) {
      $filename = $most_recent_cachefile;
  } else {
    print "Found no fresh event. Moving on to the next-most-stale-event from $recent_cache<br/>\n";
    # Ok, nothing fresh. Find the next-most-stale event.
    for $f (@cachefiles) {
      print "Looking at $f<br/>\n";
      if($f lt $recent_cache) {         
        print "Found stale file $f<br/>\n";
        $filename = $f; last; 
      }
    }
  }
  
} else {
  #Return most recent file.
  print "Simple method: serving most recent cache file: $filename</br>\n";
}

open(READCACHE,"<$filename") || print "Can't open $filename for reading </br>\n";
$result = "";
while(<READCACHE>) {
  $result .= $_;
}
close READCACHE;

$result .= ",\"live_cache_file\":\"" . $filename . "\"";
ArachneServerTools::serve($result);






