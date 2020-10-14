#!/usr/bin/perl -w
use CGI::Pretty qw/:standard *table *tr start_Tr start_td start_ul start_tbody end_tbody *div/;
use CGI::Carp qw/warningsToBrowser fatalsToBrowser/;
use POSIX qw(strftime);
use URI::Escape;  

print header;

#find the requested username.
$username=url_param("keywords");
#escape all slashes so user can't muck up my filesystem.
$username=~s/\//___/g;
print comment("username: ".$username);

#did they submit data?
if(defined(param('links'))) {
  print comment('saving data');
  print comment(param('links'));
    mkdir('storage');
    open(USERDATAOUT,">storage/$username");
    print USERDATAOUT param('links');
    close(USERDATAOUT);
}

# read any data available.
$data = "";
if(open(USERDATA,"<storage/$username")) {
  while(<USERDATA>) {
    $data .= $_;
  }
  close(USERDATA);
}    

# suck in template.
open(TEMPLATE,"<frame.html");
while(<TEMPLATE>) {
  s/PERL_WILL_FILL_THIS_WITH_RAW/$data/;
  print $_;
}
