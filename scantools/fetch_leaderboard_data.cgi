#!/usr/bin/perl -w

#
# This script opens up the scanner_inbox and tscans tables on the server, and looks for users
# to gossip about.

use warnings;
use CGI qw/:standard *table *Tr *td start_ul/;
use DBI();
use XML::Writer;
use File::Temp qw/ tempfile/;
use CGI::Carp qw(carpout);

open(LOG,">fetch_leaderboard_data.log");
carpout(LOG);

sub GetUserCompletedEvents {
  my $start_time = time;
  my $user = shift;
  my $query = "select count(*) from tscans where user_name='$user';";
  print LOG $query . "\n";
  my $res = $dbh->selectrow_array($query,undef);
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserCompletedUniqueEvents {
  my $user = shift;
  my $query = "select count(distinct det,recoVer,run,subrun,gate,slice) from tscans where user_name='$user';";
  print LOG $query . "\n";
  my $res = $dbh->selectrow_array($query,undef);
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserLatestScan {
  my $user = shift;
  my $query = 'select UNIX_TIMESTAMP(modification_date) from tscans where user_name="' 
            . $user .'" order by modification_date desc limit 1;';
  print LOG $query . "\n";
  my $res = $dbh->selectrow_array($query,undef);  
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserInboxCount {
  my $user = shift;
  my $query = "select count(*) from scanner_inbox where user_name='$user';";
  print LOG $query . "\n";
  my $res = $dbh->selectrow_array($query,undef);  
  if(defined($res)) {return $res;}
  return 0;
}

print header(-type => 'text/xml',
             -Access_Control_Allow_Origin => "*");

chmod 0666, "leaderboard.xml";

# Check to see if it's been long enough between queries.
my $latency = (-M "leaderboard.xml") * 24*60;
if(! -r "leaderboard.xml") { $latency = 99999999999; }
# print $latency . "\n";
if( $latency > 30) { # minutes  

  #Load configuration.
  #print "Reading configuration from sql_config.pl\n";
  $db = $user = $host = $pass = "";
  require "../config/sql_config.pl" || die;

  $dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});
  # do something here if error.

  # Get a list of user names.
  @users = ();
  my $query = "(select distinct(user_name) from tscans) union (select distinct(user_name) from scanner_inbox) order by user_name;";
  print LOG $query . "\n";
  my $sth = $dbh->prepare($query);
  $sth->execute();
  while (my $ref = $sth->fetchrow_arrayref()) {
    push @users,$ref->[0];
  }


  $max_events = 0;
  @data = ();
  foreach $user (@users) {
    $lastdate = GetUserLatestScan($user);
    if(defined(param('afterdate'))){
      if($lastdate < param('afterdate')) {next;};    
    }
    $ref = [$user,
            GetUserCompletedEvents($user),
            GetUserCompletedUniqueEvents($user),
            scalar(localtime($lastdate)),
            GetUserInboxCount($user)
            ];
    my $tot = $$ref[2] + $$ref[4];
    if($tot > $max_events) {$max_events = $tot;}
    push @data,$ref;
    # print update_progress_bar;
  }

  # Sort the list by 'events scanned'
  sub my_sort {
    return -($$a[2]<=>$$b[2]);
  }
  @data = sort my_sort @data;

  (my $fh, my $filename) = tempfile();
  my $writer = new XML::Writer(OUTPUT => $fh);
  $writer->startTag('leaderboard',
                      "timestamp" => scalar(gmtime()));

  foreach $ref (@data) {
    $writer->startTag('user');
    $writer->dataElement('username'  , $$ref[0]);
    $writer->dataElement('completed' , $$ref[1]);
    $writer->dataElement('unique'    , $$ref[2]);
    $writer->dataElement('latest'    , $$ref[3]);
    $writer->dataElement('inbox'     , $$ref[4]);
    $writer->endTag('user');
  }
  $writer->endTag('leaderboard');
  $writer->end();

  $fh->close();

   # atomic move.
  rename $filename,"leaderboard.xml";
}

open(LEADERBOARD,"<leaderboard.xml");
while(<LEADERBOARD>) { print $_; };
close LEADERBOARD;
chmod 0666, "leaderboard.xml";

