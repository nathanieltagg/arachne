#!/usr/bin/perl -w
use CGI qw/:standard/;
use POSIX ();

print header();

print start_html("kill_ntuple_server.cgi");
print "<pre>";

print "BEFORE: -------- \n";
system("ps aux | grep ntuple-server");

print "\n\n";

print "</pre>";
print end_html;
