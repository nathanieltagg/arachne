#!/usr/bin/perl -w

use DBI();

@users = ( 
	  "TM-1trkwe"
          ,"TM-ttwe"
          ,"Lauren"
          ,"Colton Staircase"
          ,"Colton Staircase-2"
          ,"Bmanocles-SS2"
          ,"Erin_vE"
          ,"LE4"
          ,"stef6"
          ,"work damn you"
          ,"stef5"
          ,"Hyupwoo Lee"
          ,"VPTest"
          ,"Lauren and Erin"
          ,"Colton"
          ,"Colton OC"
          ,"tryagain"
          ,"Colton ECAL"
          ,"P. Cravens ecalecstacy"
          ,"sttest"
          ,"Vttorio electron Paolone"
          ,"abc"
          ,"dytman"
          ,"Ghaneshwar k-starplus Gautam"
          ,"Lauren-test1"
          ,"LW_Nue_Candidates"
          ,"newtrk1"
          ,"tice yet again"
          ,"VPenu1"
                 );



#print "Reading configuration from sql_config.pl\n";
$db = $user = $host = $pass = "";
require "../config/sql_config.pl" || die;
#require "../config/sql_config_minerva.pl" || die;
$dbh = DBI->connect("DBI:mysql:database=$db;host=$host","$user", "$pass",{'RaiseError' => 1});



# main program.


foreach $user (@users) {
     $query = "delete from scanner_inbox where user_name='$user';";
    print $query . "\n";
    $dbh->do($query);
     $query = "delete from tscans where user_name='$user';";
    print $query . "\n";
    $dbh->do($query);
  
 }


