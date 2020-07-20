#!/usr/bin/perl -w

#
# This script opens up the scanner_inbox and tscans tables on the server, and looks for users
# to gossip about.

use warnings;
use CGI qw/:standard *table *Tr *td start_ul/;
use DBI();

$| = 1; # Do not buffer output

sub GetUserCompletedEvents {
  my $start_time = time;
  my $user = shift;
  my $query = "select count(*) from tscans where user_name='$user';";
  my $res = $dbh->selectrow_array($query,undef);
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserCompletedUniqueEvents {
  my $user = shift;
  my $query = "select count(distinct det,recoVer,run,subrun,gate,slice) from tscans where user_name='$user';";
  my $res = $dbh->selectrow_array($query,undef);
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserLatestScan {
  my $user = shift;
  my $query = 'select UNIX_TIMESTAMP(modification_date) from tscans where user_name="' 
            . $user .'" order by modification_date desc limit 1;';
  my $res = $dbh->selectrow_array($query,undef);  
  if(defined($res)) {return $res;}
  return 0;
}

sub GetUserInboxCount {
  my $user = shift;
  my $query = "select count(*) from scanner_inbox where user_name='$user';";
  my $res = $dbh->selectrow_array($query,undef);  
  if(defined($res)) {return $res;}
  return 0;
}


#Load configuration.
#print "Reading configuration from sql_config.pl\n";
$db = $user = $host = $pass = "";
require "../config/sql_config.pl" || die;

print header;
print start_html(-title=>'MINERvA Scanner Leaderboard',
                 -style=>{-src=>'leaderboard.css', -code=>''}
                  );


$dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});
# do something here if error.

$showuser = cookie('save:inScanUserName');

# Get a list of user names.
@users = ();
my $query = "(select user_name from tscans) union (select user_name from scanner_inbox) order by user_name;";
my $sth = $dbh->prepare($query);
$sth->execute();
while (my $ref = $sth->fetchrow_arrayref()) {
  push @users,$ref->[0];
}

# @users = @users[0 .. 10];

print h1("The MINERvA Scanner Leaderboard");
print p("Found ". scalar(@users) . " users");
# print progress_bar( -from=>0, -to=>scalar(@users) ) . br;


$max_events = 0;
@data = ();
foreach $user (@users) {
  $lastdate = GetUserLatestScan($user);
  if($lastdate < 1254182400) {next;};
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

# print hide_progress_bar;

print "Done<br/>\n";


# Sort the list by 'events scanned'
sub my_sort {
  return -($$a[2]<=>$$b[2]);
}
@data = sort my_sort @data;

print start_table({-class=>"maintable",-border=>"0",-cellspacing=>"0",-cellpadding=>"0",-width=>"100%"});
print start_Tr;
print th({-class=>"user"},"Name");
print start_td;
print start_table({-class=>"progresstable",-border=>"0",-cellspacing=>"0",-cellpadding=>"0",-width=>"100%"}) . start_Tr;
print th({-class=>'completed',-width=>"50%"},"Events Completed");
print th({-class=>'assigned',-width=>"50%"},"Events Assigned");
print th({-class=>'empty',-width=>"0%"},"&nbsp;");
print end_Tr . end_table;
print end_td;
print end_Tr;
  
  foreach $ref (@data) {
    # Mouseover text
    my $mot = $$ref[0] . ": Unique events scanned:" . $$ref[1] . "  Total scanned:" . $$ref[2] . "  Inbox:" . $$ref[4] . "  Last completed: " . $$ref[3];
    
    my $class = "user";
    if( (defined($showuser)) && ($showuser eq $$ref[0]) ) {
      $class = "showuser";
    }

      print start_Tr({-title=>$mot});
      print td({-class=>$class},$$ref[0]);
      print start_td . start_table({-class=>"progresstable",-border=>"0",-cellspacing=>"0",-cellpadding=>"0",-width=>"100%"});
      print start_Tr;
      
      # Unique completed
      my $cp = $$ref[2] / $max_events * 100;
      print td({-class=>'completed',-width=>"$cp"."%"},$$ref[2]);
      # Assigned
      my $ap = $$ref[4] / $max_events * 100;
      print td({-class=>'assigned',-width=>"$ap"."%"},$$ref[4]);
      # Whitespace
      my $wp = 100. - (($$ref[4]+$$ref[2]) / $max_events * 100);
      print td({-class=>'empty',-width=>"$wp"."%"},"");

      print end_Tr;
      print end_table .end_td . end_Tr;
      print "\n";
    }
  

print end_table;
print end_html;
