#!/usr/bin/perl -w
use CGI qw/:standard/;
use JSON::XS qw(encode_json);

#
# Script to take in an uploaded XML file and simply echo it back to the requester.
#

sub myerror
{
    my $err = shift();
    print  encode_json({ error => $err});
    exit();
}

print header('application/json');

if(!defined param('thefile')) {
  myerror("echoFile.cgi: no input data!");
}

open(LOCAL,">lastecho.dat");

my $upload_filehandle = upload('thefile'); 
while(<$upload_filehandle>) { 
  print $_; 
  print LOCAL $_;
}
