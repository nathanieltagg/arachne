#!/usr/bin/perl -w
use CGI qw/:standard/;
use common qw/dbh/;

my $xmllink="access_scan_info.cgi?" . $ENV{'QUERY_STRING'};

print header;

# Connect to the database.
#Load configuration.
#print "Reading configuration from sql_config.pl\n";

                       

my $sel = "";
my $query = "";

import_names('p');

# Parse extra selections.
if( defined($p::det) && ($p::det ne "") ) {
  push(@sels,"tscans.det=" . '"'.$p::det.'"');
}
if( defined($p::recoVer) && ($p::recoVer ne "") ) {
  push(@sels,"tscans.recoVer=" . $p::recoVer);
}
if( defined($p::run) && ($p::run ne "") ) {
  push(@sels,"tscans.run=" . $p::run);
}
if( defined($p::subrun) && ($p::subrun ne "")) {
  push(@sels,"tscans.subrun=" . $p::subrun);
}
if( defined($p::snarl) && ($p::snarl ne "") ) {
  push(@sels,"tscans.snarl=" . $p::snarl);
}
if( defined($p::slice) && ($p::slice ne "") ) {
  push(@sels,"tscans.slice=" . $p::slice);
}
if( defined($p::user_name) && ($p::user_name ne "") ) {
  push(@sels,"tscans.user_name='" . $p::user_name . "'");
}

foreach my $i (0..$#sels) {
  if($i==0) {$sel = "WHERE ";}
  else {$sel .= " AND "}
  $sel .= $sels[$i];
  $i++;
}


$query = "select * from tscans $sel order by det asc, recoVer asc, run asc, subrun asc, snarl asc, slice asc, modification_date desc";
if(defined(param('bestonly'))) {
  # A much more complicated query.
  # The purpose of this is to return only one unique scan entry for each run/sub/snarl/slice/user, returning only the most recent entry.
  $query =  "select tscans.* "
          . " from ( "
          . "       select  user_name,det,run,subrun,snarl,slice,max(modification_date) as recdate "
          . "       from tscans "
          . "      group by user_name,det,run,subrun,snarl,slice "
          . "   ) as t1 "
          . " inner join tscans "
          . " on ( t1.user_name=tscans.user_name "
          . "    AND t1.det=tscans.det "
          . "    AND t1.recoVer=tscans.recoVer "
          . "    AND t1.run=tscans.run "
          . "    AND t1.subrun=tscans.subrun "
          . "    AND t1.snarl=tscans.snarl "
          . "    AND t1.slice=tscans.slice "
          . "    AND t1.recdate=tscans.modification_date)"
          . " $sel";
}

print p("Database accessed with query:");

print p(a({href=>"$xmllink"},"Click here for XML version of this query."));
print code($query);
print br;
print hr;
print "\n";
  
my $sth = dbh()->prepare($query);
$sth->execute();

@fields = @{$sth->{NAME}};

#print "@fields\n";


# wrap up the answer all nice and neat in html.
print "<div style='overflow: auto'>";
print "<table>\n";
print "<tr>";

for my $f (@fields) {
  print th($f);
}
print "</tr>\n";

while (my $ref = $sth->fetchrow_arrayref()) {
  print"<tr>";
  for my $v  (@{$ref}) {
    print td($v);
  }
  print "<tr>\n";
}
print "</table></div>";

print end_html;

$sth->finish();

