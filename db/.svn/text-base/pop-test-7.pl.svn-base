#!/usr/bin/perl -w

#
# This script opens up the scanner_inbox table on the server, and looks for entries 
# assigned to the specified user.  It checks the current entries against completed scans
# in the tscan table, and removes entries that have been completed.
# When it finds an inbox entry that has not been completed, it immediately returns the new inbox
# entry.

use CGI qw/:standard/;
use DBI();


# Connect to the database.
my $db   = "arachne";
my $host = "minerva05.fnal.gov";
my $user = "ntagg";
my $pass = "Eedase1o";
# my $db   = "minervascan";
# my $host = "neutrino.otterbein.edu";
# my $user = "scanner";
# my $pass = "axial";

my $dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});

#event data.  run   subrun   gate   slice
@events = (  [ 576,     16  ,   350   ,     1 ]
          ,  [ 576,     16  ,   660   ,     2 ]
          ,  [ 576,     16  ,   698   ,     2 ]
          ,  [ 576,     16  ,   865   ,     1 ]
          ,  [ 576,     18  ,   65    ,     3 ] 
          ,  [ 576,     18  ,   206   ,     1 ]
          ,  [ 576,     18  ,   1140  ,     2 ]
          );

#Names of people.
@scanners = ( "dummy1"
 , "Alania-7"
 , "Boyd-7"
 , "Castromonte-7"
 , "Cravens-7"
 , "Day-7"
 , "Eberly-7"
 , "Gallagher-7"
 , "Hansen-7"
 , "Hobbs-7"
 , "Kafka-7"
 , "Kordosky-7"
 , "Lee-7"
 , "Maher-7"
 , "Manly-7"
 , "Mann-7"
 , "Marshall-7"
 , "McGowan-7"
 , "Mislivec-7"
 , "Morfin-7"
 , "Mousseau-7"
 , "Naples-7"
 , "Napora-7"
 , "Nelson-7"
 , "GNiculescu-7"
 , "INiculescu-7"
 , "Park-7"
 , "Paolone-7"
 , "Palomino-7"
 , "Perdue-7"
 , "Peterman-7"
 , "Ransome-7"
 , "Simon-7"
 , "Stamoulis-7"
 , "Stefanski-7"
 , "Stevens-7"
 , "Tice-7"
 , "Walker-7"
 , "Walton-7"
 , "Ziemer-7"
 );

foreach $scanner (@scanners) {
  print "$scanner ----- \n";
  for $i ( 0 .. $#events) {
    $query = "insert into scanner_inbox (user_name, run, subrun, gate, slice) VALUES ("
           . "'$scanner',"           
           . $events[$i][0] . ","
           . $events[$i][1] . ","
           . $events[$i][2] . ","
           . $events[$i][3] . ");";
    print $query . "\n";
    $dbh->do($query);
    
  }
}
