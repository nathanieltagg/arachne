#!/usr/bin/perl -w

#
#
use CGI qw/:standard *table *tr start_ul/;
use File::stat;
use Time::localtime;

$data_glob = "/minerva/data/users/minerva/data_processing/dst/*_DST*.root";

print header;
print start_html(-title=>'Arachne Recent Shift Data',
                 -style=>{'src'=>'../css/smoothness/jquery-ui-1.7.2.custom.css'},
	         -head=>Link({-rel=>"icon",-type=>"image/png",-href=>"../images/hex_icon.png"})
                 );

#<link rel="icon"  type="image/png" href="images/hex_icon.png" /> 
print h2('Links to recently-processed DST files: (click to see events)');


# find files.
@files = (glob($data_glob));
@files = sort { -M $a <=> -M $b } @files;  # order by time.
#@files = reverse @files;

print start_table(-border=>"1");

foreach $file (@files) {
  $age = -M $file;
  #if($age > 10.0/24.0) { last; }
  if($age > 2) { last; }
  print "<tr>";
  $link = "../arachne.html?filename=$file&entry=1&slice=-1";
  $base = ($file =~ m|.*/(.*)|)[0];
  $datetime_string = ctime(stat($file)->mtime);
  print td($datetime_string);
  print td(a({-href=>$link},"$base"));
  $link = "../arachne.html?filename=$file&selection=n_idhits>100&entry=1&slice=-1";
  print td(a({-href=>$link},"Link to first event with n_idhits&gt;100"));
  print "</tr>\n";
}
print end_table;

print end_html;
