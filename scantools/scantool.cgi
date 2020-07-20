#!/usr/bin/perl -w

#
# This script opens up the scanner_inbox table on the server, and looks for entries 
# assigned to the specified user.  It checks the current entries against completed scans
# in the tscan table, and removes entries that have been completed.
# When it finds an inbox entry that has not been completed, it immediately returns the new inbox
# entry.

use CGI qw/:standard *table start_ul/;
use CGI::Carp qw/warningsToBrowser fatalsToBrowser/;
use DBI();

#Load configuration.
#print "Reading configuration from sql_config.pl\n";
$db = $user = $host = $pass = "";
require "../config/sql_config.pl" || die;

# do this to get the menu order right.
@dataset_list = ( "7event"
                , "dirty_dozen"
                , "ecal_ecstasy"
                , "satans_stair"
                , "debbie_monday"
                , "quasi-elastics"
                , "two-track-quasi-candidates"
                , "vittorio-cc-nue"
                , "TM-electrons"
                , "VP-SM-electrons"
                , "single-track-exiting"
                , "two-track-with-exit"
                , "three-tracks"
                , "four-tracks"
                , "gamma_conversions"
                , "vee_vertices"
                , "thingie-track"
		, "two-track-with-exit-part1"
		, "two-track-with-exit-part2"
                , "mu-neutrino"
                , "e-neutrino"
                , "proton"
                , "neutron"
                , "muon"
                , "electron"
                , "pi-plus"
                , "pi-minus"
                , "pi-zero"
                , "eta"
                , "Kplus"
                , "Kminus"
                , "Kzero"
                , "Kzbar"
                , "eta-prime"
                , "rho-plus"
                , "rho-minus"
                , "rho-zero"
                , "omega"
                , "Kstar-plus"
                , "Kstar-minus"
                , "Kstar-zero"
                , "Kstar-zbar"
                , "phi"
                , "lambda"
                , "sigma"
                , "nstar"
                , "delta"
                , "sigma-star"
                , "eta-prime-minus"
                , "eta-prime-plus"
                , "positron"
                , "Kstar-plus-plus"
                , "rho-plus-minus"
                , "rho-plus-plus"
                , "rho-plus-plus-plus"
                );

$dataset_names{'7event'      } = "Heaven's Seven - initial scan trials";
$dataset_names{'dirty_dozen' } = "The Dirty Dozen";
$dataset_names{'ecal_ecstasy'} = "ECAL Ecstasy";
$dataset_names{'satans_stair'} = "Satan's Staircase";
$dataset_names{'debbie_monday'} = "Debbie's Monday";
$dataset_names{'two-track-quasi-candidates'} = "Quasi Candidates (2-track)";
$dataset_names{'vittorio-cc-nue'} = "Vittorio's CC Nu-e candidates";
$dataset_names{'quasi-elastics'} = "Tony and Tomas's Quasi-Elastics";

sub LoadEvents
{
  my $set = shift;
  my $events = [];
  my $filename = "$set.game";
  print p("Loading file $filename\n");
  open(FILE,"<$filename");
  while($line = <FILE>) {
    my @val = split(/[|,:\t ]/,$line);
    # remove null elements.
    my $n = scalar(@val);
    for(my $i=0;$i<$n;$i++) {
      my $non_null = shift(@val);
      if(length($non_null)) { push(@val,$non_null); }
    }
    #print "Got entry: " . join(':',@val) . br . "\n";

    if(scalar(@val) ge 6) {
      push @$events,[@val];
      # print "Got entry: " . join(':',@val) . br . "\n";
    }
  }
  close(FILE);
  return $events;
}

sub AddEvents
{
  my $scanner = shift;
  my $events = shift;
  #my $org_events = shift;
  #my @events = reverse(@$org_events); # flip it so insert order is backwards.
  if(scalar(@$events) eq 0) { return; }
  for my $i ( 0 .. $#$events) {
    $query = "insert into scanner_inbox (user_name, det, recoVer, run, subrun, gate, slice) VALUES ("
           . "'$scanner',"
           . "'" . $events->[$i][0] . "',"
           . "'" . $events->[$i][1] . "',"
           . $events->[$i][2] . ","
           . $events->[$i][3] . ","
           . $events->[$i][4] . ","
           . $events->[$i][5] . ");";

    #print $query . br;  #debugging line.
    $dbh->do($query);
  }
  
}

sub ParseText
{
  my @events = ();
  my $det = shift;
  my $ver = shift;
  my $text = shift;
  # print "Text: " . $text . br . "\n";
  my @lines = split(/[\n\r]/,$text);
  # print scalar(@lines) . "lines" . br . "\n";
  foreach my $line (@lines) {
    my @val = split(/[^\d]/,$line);
    # remove null elements.
    var $n = scalar(@val);
    for(my $i=0;$i<$n;$i++) {
      my $non_null = shift(@val);
      if(length($non_null)) { push(@val,$non_null); }
    }
    
    if(scalar(@val) eq 4) {
      push @events,[($det,$ver,@val)];
      print "Got entry: " . join(':',@val) . br . "\n";
    }
  }
  print strong("Found " . scalar(@events) . " entries.") . br;
  return \@events;
}

my $user_name = "";
if(param('user_name')) {  
    $user_name = param('user_name'); 
    $username_cookie = cookie(-name=>'arachne-scanner-login-name',
                          -value=>$user_name,
                          -expires=>"+10y");
} else {
  $user_name = cookie('arachne-scanner-login-name');
}

if(!defined($user_name) || ($user_name eq '')) { $user_name = "Anonymous Coward"; };

print header(-cookie=>$username_cookie);

print start_html(-title=>'Arachne Scanner Tool',
                 -style=>{'src'=>'../css/smoothness/jquery-ui-1.7.2.custom.css'});


$dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});
# do something here if error.


print h2('Scanner Inbox Tools');

print start_form(-name=>'form1',-action=>"scantool.cgi",-method=>'POST');

print "User Name:";
print br;
print textfield(-name=>'user_name',-value=>$user_name,-size=>50,
                -onChange=>"document.form1.submit()");

print submit(-name=>"info",-label=>'Get Info');
print br;

print h4('Game Loading:');
print popup_menu(-name=>'event_list',
                 -values=>\@dataset_list,
                 -labels=>\%dataset_names
                 );
  
print submit(-name=>"load",-label=>'Load Game');
                 
print br . hr;

print h4('Custom Inbox Load');
print popup_menu(-name=>'det',
                 -values=>['TP','MN', 'MV', 'SIM_minerva', 'SIM_frozen', 'SIM_prototype'],
                 -default=>'MV'
                 );
print " :: " ;
print popup_menu(-name=>'recoVer',
                -values=>[
                  #'v6r2p1','v7r0p1', 'v7r0p2', 'v7r0p3', 'v7r3', 'v7r3p1', 'v7r4', 'v7r5', 
                  #'v7r5p1', 'v7r6', 
                  'v7r7', 'v8r2', 'v8r2p1', 'v8r2p2', 'v8r3_DEV', 
                  'v9r1', 'v10r2p2', 'v10r4p3', 'v10r6'
                ],
                -default=>'v10r6'
                );
print br br;
print textarea(-name=>"event_data",-rows=>8,-columns=>30,
               -value=>'Enter events here, one entry per line, in the form run/subrun/gate/slice (any separator will do)');
print submit(-name=>"load_manual",-label=>'Load Event Data');

print h4('Inbox maintenance:');
print submit(-name=>"remove_scanned",-label=>'Remove Scanned Events'); 
print em("Removes events from your inbox that you have already scanned at least once.");
print br . br;

print submit(-name=>"remove_dupes",-label=>'Remove Duplicate Events'); 
print em("Removes duplicate entries from your inbox.");
print br . br;

print submit(-name=>"delete_all",-label=>'Clear Entire Inbox',-onClick=>"return confirm('Are you sure you want to delete the whole inbox? This is not reversible.');");
print em("Removes all events from your inbox.");
print br . br;
 
print endform;

print hr;



# ## Debugging:
# if(param) {
#   print Dump;
# }

my $det = "TP";
my $ver = "v6r2p1";


if(param('det'))       {  $det = param('det'); }
if(param('recoVer'))   {  $ver = param('recoVer'); }


# OK, here's where we actually do things.
if(param('info')) {
  # do nothing, this is a valid entry.
} elsif (param('load')) {
  
  ##
  ## Load some data.
  ##
  print p("Loading game " . param('event_list'));
  my $events = LoadEvents(param('event_list'));
  print p("Loading " . scalar(@$events) . " events.");
  AddEvents($user_name,$events);

} elsif (param('load_manual')) {
  
  ##
  ## Load some data.
  ##
  my $text = param('event_data');
  my $events = ParseText($det,$ver,$text);
  AddEvents($user_name,$events);

} elsif (param('remove_dupes')) {
  $query = "select id,det,recoVer,run,subrun,gate,slice from scanner_inbox where user_name='$user_name';";
  my $sth = $dbh->prepare($query);
  $sth->execute();

  #Column names:
  #@fields = @{$sth->{NAME}};

  my @data = ();
  my @dupes = ();

  while (my $ref = $sth->fetchrow_arrayref()) {
  	my $aref2 = [@{$ref}];
    push @data,$aref2;
    # print "Got @$ref\n";
  }
  my $n = scalar(@data);

  print "Retrieved $n rows.\n";

  sub inbox_match {
    my $a = shift;
    my $b = shift;
    if($a->[5] != $b->[5]){ return 0; }# gate
    if($a->[3] != $b->[3]){ return 0; }# run
    if($a->[4] != $b->[4]){ return 0; }# subrun
    if($a->[6] != $b->[6]){ return 0; }# slice
    if($a->[1] ne $b->[1]){ return 0; }# det
    if($a->[2] ne $b->[2]){ return 0; }# reco
    print "Match: @$a @$b\n";
    return 1;
  }

  for(my $i = 0; $i<$n; $i++){
    if(exists($data[$i])) {
      # print "Considering $i: " . @{$data[$i]} . "\n";
      for(my $j = $i+1; $j<$n; $j++){
        if(exists($data[$j])) {
          # print "   and $j: @{$data[$j]}\n";
          if( inbox_match($data[$i],$data[$j]) ) {
            push @dupes,$data[$j]->[0];      
            delete $data[$j];
          }
        }
      }
    }
  }

  $nd = scalar(@dupes);
  print "Found $nd duplicates.\n";

  for(my $i = 0; $i<$nd; $i++) {
    $query = "delete from scanner_inbox where id=" . $dupes[$i] . ";";
  	$dbh->do($query);
    # print $query . "\n";
  }

} elsif (param('remove_scanned')) {
  # Cull already-completed inbox entries.
  # my $query = "delete from scanner_inbox using scanner_inbox INNER JOIN tscans WHERE
  #         scanner_inbox.user_name= tscans.user_name AND
  #         scanner_inbox.det      = tscans.det       AND
  #         scanner_inbox.recoVer  = tscans.recoVer   AND
  #         scanner_inbox.run      = tscans.run       AND
  #         scanner_inbox.subrun   = tscans.subrun    AND
  #         scanner_inbox.gate     = tscans.gate       AND
  #         scanner_inbox.slice    = tscans.slice;";
  # $dbh->do($query);
  # print p("Inbox entries removed with sql command:");
  # print pre($query);
  # print p;
  
  $query = "select id,det,recoVer,run,subrun,gate,slice from scanner_inbox where user_name='$user_name';";
  my $sth = $dbh->prepare($query);
  $sth->execute();

  #Column names:
  #@fields = @{$sth->{NAME}};

  my @data = ();
  my @dupes = ();

  while (my $ref = $sth->fetchrow_arrayref()) {
  	my $aref2 = [@{$ref}];
    push @data,$aref2;
    # print "Got @$ref\n";
  }
  my $n = scalar(@data);

  print "Retrieved $n rows.\n";

  foreach $ref (@data) {
    $query = "select count(*) from tscans where user_name='$user_name' "
     . " and det='" . $ref->[1] . "'"
     . " and recoVer='" . $ref->[2] . "'"
     . " and run=" . $ref->[3] 
     . " and subrun=" . $ref->[4] 
     . " and gate=" . $ref->[5] 
     . " and slice=" . $ref->[6]
     . ";";

    my $rowCount = $dbh->selectrow_array($query,undef);
    if($rowCount>0) {
      push @dupes, $ref->[0];
    }    
  }

  $nd = scalar(@dupes);
  print "Found $nd duplicates.\n";

  for(my $i = 0; $i<$nd; $i++) {
    $query = "delete from scanner_inbox where id=" . $dupes[$i] . ";";
    $dbh->do($query);
    # print $query . "\n";
  }
  
} elsif (param('delete_all')) {
  $dbh->do("delete from scanner_inbox where user_name='$user_name'");
  
}



print h3("Inbox for $user_name");

my $rowCount = $dbh->selectrow_array(
      "SELECT count(*) FROM scanner_inbox WHERE user_name='" . $user_name . "';"
      ,undef);
      
# satan.
#if($rowCount>58){ $rowCount = $rowCount - 58; }

print p("You currently have $rowCount events in your inbox.");

my $query = "select * from scanner_inbox WHERE user_name='" . $user_name ."' order by id asc limit $rowCount;";
my $sth = $dbh->prepare($query);
$sth->execute();

my $firstlink ="";

if($rowCount > 0) {
  print h4("Current inbox contents:");
  print "<div style='width: 600px; height: 200px; border : solid 2px black; overflow: auto;'>";
  print start_table(-border=>"1");
  #Column names:
  @fields = @{$sth->{NAME}};
  print "<tr>";
  foreach $i (@fields) {
    print th($i);
  }
  print "</tr>";

  my $rownum = 0;
  while (my $ref = $sth->fetchrow_hashref()) {
    print "<tr>";
    foreach $i (0..$#fields) {
      print td($ref->{$fields[$i]});
    }
       
    my $link = "../arachne.html"
             . "?det=".$ref->{'det'}
             . "&recoVer=".$ref->{'recoVer'}
             . "&run=".$ref->{'run'}
             . "&subrun=" . $ref->{'subrun'}
             . "&gate=" . $ref->{'gate'}
             . "&slice=" . $ref->{'slice'};

     if($rownum==0) { $firstlink = $link; };
       
     print td(a({-href=>$link},"link"));
     print "</tr>"; 
     $rownum++;   
  }
  $sth->finish();

  print end_table();
  print "</div>";
}

print hr;
if($rowCount >0) {
  print a({-href=>$firstlink},
           "Click here to go to the first event in your inbox.");
} else {
  print a({-href=>"../arachne.html"},
           "Click here to go to the event display.");
  
} 
print hr;



print end_html;
