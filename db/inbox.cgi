#!/usr/bin/perl -w

#
# This script opens up the scanner_inbox table on the server, and looks for entries 
# assigned to the specified user.  It checks the current entries against completed scans
# in the tscan table, and removes entries that have been completed.
# When it finds an inbox entry that has not been completed, it immediately returns the new inbox
# entry.

use CGI qw/:standard/;
use DBI();


sub myerror
{
    my $err = shift();
    print '<?xml version="1.0" encoding="ISO-8859-1"?>';
    print '<result><error>';
    print $err;
    print '</error></result>';
    exit;
}

print header("text/xml");

# Connect to the database.
# my $db   = "arachne";
# my $host = "minerva05.fnal.gov";
# my $user = "ntagg";
# my $pass = "Eedase1o";
my $db   = "minervascan";
my $host = "neutrino.otterbein.edu";
my $user = "scanner";
my $pass = "axial";

my $dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});

my $result = "<result>\n";

if(!defined(param("user_name"))) {
  myerror("No user_name provided.")
}

# Cull already-completed inbox entries.
my $query = "delete from scanner_inbox using scanner_inbox INNER JOIN tscans WHERE
        scanner_inbox.user_name= tscans.user_name AND
        scanner_inbox.run      = tscans.run       AND
        scanner_inbox.subrun   = tscans.subrun    AND
        scanner_inbox.gate     = tscans.gate       AND
        scanner_inbox.slice    = tscans.slice;";
$dbh->do($query);


# see how many inbox entries are left.
my $dummy;
my $rowCount = $dbh->selectrow_array(
      "SELECT count(*) FROM scanner_inbox WHERE user_name='" . param('user_name') . "';"
      ,undef);

$result.="<inbox_count>" . $rowCount . "</inbox_count>";
if($rowCount > 0) {

  # retrieve the first inbox query.
  $query = "select * from scanner_inbox WHERE user_name='" . param('user_name') . "' limit 1;";
  my $sth = $dbh->prepare($query);
  $sth->execute();
  #Column names:
  @fields = @{$sth->{NAME}};
  $result .= "<next_in_inbox>";
  my $ref = $sth->fetchrow_arrayref();
    foreach $i (0..$#fields) {
      $f = $fields[$i];
      $result .= "<$f>" . $ref->[$i] . "</$f>";
    }
  $result .= "</next_in_inbox>";
  $sth->finish();
}
$result .= "</result>";

print $result;
