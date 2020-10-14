#!/usr/bin/env perl

$file = shift;
$tag = shift;

print "looking at size of $file, finding total bytes assigned to tags of type $tag\n";

open FILE, $file or die $!;


$/ = ">";
$size = 0;
while(<FILE>) {

  if(/\<$tag *.*\>/../\<\/$tag\>/) {
    # s/.*\<$tag\>//;
    # s/\<\/$tag\>.*//;
    # next if /START/ || /END/;
    $size += length;
    # print $_ . "\n";
  }
}

print "$size  bytes\n";
