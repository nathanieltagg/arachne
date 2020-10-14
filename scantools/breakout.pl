#!/usr/bin/perl -w

#
# This script opens up the file described on the command line, 
# and doles events out to users. Use the skip_to option to skip
# users (i.e. when adding users onto the end)
# Use the $events_per_user and $overlaps config to define
# how many events go to each user and how many are overlapped with the next
# user (for cross-check purposes).

use DBI();

#Load configuration.

my $events_per_user = 1000;
my $overlaps        = 100;
my $skip_to         = "";

my $det = "TP";
my $ver = "v7r0p1";

@games = ( 
                 "mu-neutrino",
                 "e-neutrino",
                 "proton",
                 "neutron",
                 "muon",
                 "electron",
                 "pi-plus",
                 "pi-minus",
                 "pi-zero",
                 "eta",
                 "Kplus",
                 "Kminus",
                 "Kzero",
                 "Kzbar",
                 "eta-prime",
                 "rho-plus",
                 "rho-minus",
                 "rho-zero",
                 "omega",
                 "Kstar-plus",
                 "Kstar-minus",
                 "Kstar-zero",
                 "Kstar-zbar",
                 "phi",
                 "lambda",
                 "sigma",
                 "nstar",
                 "delta",
                 "sigma-star",
                 );





# main program.

my @events = ();
my $filename = shift;
open(FILE,"<$filename");
# print "Text: " . $text . br . "\n";
while($line = <FILE>) {
  my @val = split(/[^\d]/,$line);
  # remove null elements.
  my $n = scalar(@val);
  for(my $i=0;$i<$n;$i++) {
    my $non_null = shift(@val);
    if(length($non_null)) { push(@val,$non_null); }
  }
  
  if(scalar(@val) eq 4) {
    push @events,[@val];
    #print "Got entry: " . join(':',@val) . br . "\n";
  }
}
close(FILE);
my $nevent = scalar(@events);
print "Found $nevent entries.\n";


my $ievent = 0;

foreach $game (@games) {
  
  my $ibeg = $ievent;
  if($ievent > $overlaps) { $ibeg = $ievent - $overlaps; }
  my $iend = $ibeg + $events_per_user;
  if($iend >= $nevent) { $iend = $nevent-1 };
  print "Assigning events $ibeg through $iend to game $game\n";  
  my @chunk = @events[$ibeg .. $iend-1];

  my $outfile = "$game.game";
  open(OUTFILE,">$outfile");
  foreach $ev (@chunk) {
    print OUTFILE "$det\t$ver\t" . $ev->[0] . "\t"  . $ev->[1] . "\t"  . $ev->[2] . "\t"  . $ev->[3] . "\n";  
  }
  close OUTFILE;

  $ievent = $iend;
  if($ievent >= $nevent-1) {
    print "Ran out of events\n";
    exit 0;
  }
}

print "Finished with " . ($nevent - $ievent) . " events remaining. \n";

