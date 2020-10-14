#!/usr/bin/perl -w
use CGI::Pretty qw/:standard *table *tr start_Tr start_td start_ul start_tbody end_tbody *div/;
use CGI::Carp qw/warningsToBrowser fatalsToBrowser/;
use POSIX qw(strftime);
use URI::Escape;  

print header;
print start_html;

if (! opendir(IMD, 'storage') )
{ 
    print p("Cannot open directory 'storage'");
    print end_html; 
    exit(); 
};

@thefiles= readdir(IMD); 
closedir(IMD);

@thefiles = sort @thefiles;

print h4("List of all Roundups.");

foreach $i (@thefiles)
{
  next if ($i =~ /^\./);
  $l = a({-href=>$i},$i);
  print $l . br;
}


print end_html;