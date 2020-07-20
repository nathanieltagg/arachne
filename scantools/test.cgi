#!/usr/bin/perl
use CGI qw/:standard *table start_ul/;
use DBI;

print header;
print start_html;

print join("<br/>", @INC);
print join("\n",%ENV);
