#!/usr/bin/perl -w
use CGI qw/:standard :cgi-lib/;
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

#Load configuration.
#print "Reading configuration from sql_config.pl\n";
$db = $user = $host = $pass = "";
if ( ! -r "../config/sql_config.pl" ) { exit 0; } 
require "../config/sql_config.pl" ||exit 0;

# Connect to the database.
my $dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});


my $result = "<result>\n";
if(defined(param('action')) && param('action') eq 'insert')
{

  @parameters=( 'det'
               ,'recoVer'
               ,'run'
               ,'filename'
               ,'subrun'
               ,'gate'
               ,'slice'
               ,'user_name'
               ,'shower_prongs'
               ,'track_prongs'
               ,'vertex_hits'
               ,'gamma_conversions'
               ,'vee_vertices'
               ,'neutrons'
               ,'prong1_character' 
               ,'prong2_character' 
               ,'prong3_character' 
               ,'flags'            
               ,'notes'            
               ,'idhits'
               ,'odhits'
               ,'tmean'
               ,'calpe'
               ,'manreco'
                );

  # better insertion strategy:
  # Use place holders (?,?,?) to ensure auto-escaping of tricky characters
  # Use a hash slice to deliver the data.
  # Requires input format to match table format.

  my $cols = join(', ',@parameters);
  $cols .= ',modification_date';
  my $vals = join(', ', ('?') x @parameters);
  $vals .= ', now()';

  my $query = "INSERT into tscans ($cols) values ($vals)";
  %parhash = Vars;
  my $sth = $dbh->prepare($query);
  $sth->execute(@parhash{@parameters});
  
  $result .= "<insert_command>$query</insert_command>";
  $result .= "<insert_parameters>"
          . join(', ',@parhash{@parameters})
          ."</insert_parameters>";

  # foreach my $par (@parhash{@cols}); # hash slice makes sure it lines up. 
  # {
  #   if(defined(my $val = param($par))) {
  #     if($cols ne "") { $cols .= ','; $vals .= ','}
  #     $cols .= $par;
  #     $vals .= "'" . $val . "'";
  #   
  #   } else {
  #     myerror("Parameter $par not defined!");
  #   }
  # }
  # 
  # $cols .= ',modification_date';
  # $vals .= ',now()';
  # $query = "insert into tscans ($cols) VALUES($vals);";
  # $result .= "<insert_command>$query</insert_command>";
  # $dbh->do($query);


  # Cull already-completed inbox entries.
  $query = "delete from scanner_inbox WHERE "
          ." user_name= '" . param('user_name') . "'"
          ." AND det      = '" . param('det') ."'"
          ." AND recoVer  = '" . param('recoVer') ."'"
          ." AND run      = " . param('run')
          ." AND subrun   = " . param('subrun')
          ." AND gate     = " . param('gate')
          ." AND slice    = " . param('slice');
  $result .= "<inbox_command>$query</inbox_command>";
  $dbh->do($query);
}

##
## Now return all results for this query (again if neccessary).
##

my $sel = "";
my $query = "";

import_names('p');

# Parse extra selections.
if( defined($p::run) && ($p::run ne "") ) {
  push(@sels,"tscans.run=" . $p::run);
}
if( defined($p::subrun) && ($p::subrun ne "")) {
  push(@sels,"tscans.subrun=" . $p::subrun);
}
if( defined($p::gate) && ($p::gate ne "") ) {
  push(@sels,"tscans.gate=" . $p::gate);
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


$query = "select * from tscans $sel order by run asc, subrun asc, gate asc, slice asc, modification_date desc";
if(defined(param('bestonly'))) {
  # A much more complicated query.
  # The purpose of this is to return only one unique scan entry for each run/sub/gate/slice/user, returning only the most recent entry.
  $query =  "select tscans.* "
          . " from ( "
          . "       select  user_name,det,recoVer,run,subrun,gate,slice,max(modification_date) as recdate "
          . "       from tscans "
          . "      group by user_name,det,recoVer,run,subrun,gate,slice "
          . "   ) as t1 "
          . " inner join tscans "
          . " on ( t1.user_name=tscans.user_name "
          . "    AND t1.det=tscans.det "
          . "    AND t1.recoVer=tscans.recoVer "
          . "    AND t1.run=tscans.run "
          . "    AND t1.subrun=tscans.subrun "
          . "    AND t1.gate=tscans.gate "
          . "    AND t1.slice=tscans.slice "
          . "    AND t1.recdate=tscans.modification_date)"
          . " $sel";
}


$result .= "<querystring>" . $query . "</querystring>\n";
  
my $sth = $dbh->prepare($query);
$sth->execute();

#Column names:
@fields = @{$sth->{NAME}};


while (my $ref = $sth->fetchrow_arrayref()) {
  $result .= "<entry>";
  foreach $i (0..$#fields) {
    $f = $fields[$i];
    $result .= "<$f>" . $ref->[$i] . "</$f>";
  }
  $result .= "</entry>\n";
}

$sth->finish();



##
## Now look for inbox information.
##
if(defined(param("user_name"))) {
  


  # see how many inbox entries are left.
  my $dummy;
  my $rowCount = $dbh->selectrow_array(
        "SELECT count(*) FROM scanner_inbox WHERE user_name='" . param('user_name') . "';"
        ,undef);
  #if($rowCount>58){ $rowCount = $rowCount - 58; }      # satan.
  

  $result.="<inbox_count>" . $rowCount . "</inbox_count>";
  
  if($rowCount > 0) {
    # retrieve info about inbox items.

     if( defined($p::det)     && ($p::det ne "")
      && defined($p::recoVer)     && ($p::recoVer ne "")
      && defined($p::run)     && ($p::run ne "")
      && defined($p::subrun)  && ($p::run ne "")
      && defined($p::gate)    && ($p::gate ne "")
      && defined($p::slice)   && ($p::slice ne "") ) {

        #
        # retrieve the next inbox item        
        #
        $query = "select * from scanner_inbox WHERE user_name='" . param('user_name') ."'"
                 . " AND NOT ( "
                 . " det='". $p::det . "'"
                 . " AND recoVer='". $p::recoVer . "'"
                 . " AND run=". $p::run
                 . " AND subrun=". $p::subrun
                 . " AND gate=". $p::gate
                 . " AND slice=". $p::slice
                 . ") ";
                 
        if( defined($p::id) && ($p::id ne "")) {
          $query .= " order by (id > " . $p::id . ") desc, id asc limit 1;"
        } else {
          $query .= "order by id asc limit 1;";
        }
        $result .= "\n<next_in_inbox_query>" . $query . "</next_in_inbox_query>\n";
  
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
 
 
        #
        # retrieve the prev inbox item        
        #
        
        $query = "select * from scanner_inbox WHERE user_name='" . param('user_name') ."'"
                 . " AND NOT ( "
                 . " det='". $p::det . "'"
                 . " AND recoVer='". $p::recoVer . "'"
                 . " AND run=". $p::run
                 . " AND subrun=". $p::subrun
                 . " AND gate=". $p::gate
                 . " AND slice=". $p::slice
                 . ") ";
                 
        if( defined($p::id) && ($p::id ne "")) {
          $query .= " order by (id > " . $p::id . ") asc, id desc limit 1;"
        } else {
          $query .= "order by id desc limit 1;";
        }
        $result .= "\n<prev_in_inbox_query>" . $query . "</prev_in_inbox_query>\n";
        $sth = $dbh->prepare($query);
        $sth->execute();
        #Column names:
        @fields = @{$sth->{NAME}};
        $result .= "<prev_in_inbox>";
        $ref = $sth->fetchrow_arrayref();
          foreach $i (0..$#fields) {
            $f = $fields[$i];
            $result .= "<$f>" . $ref->[$i] . "</$f>";
          }
        $result .= "</prev_in_inbox>";
        $sth->finish();
        
      }

  }
  
}



$result .= "</result>";

print $result;
