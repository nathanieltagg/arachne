#!/usr/bin/perl -w

use CGI qw(:standard);
use CGI::Carp qw(fatalsToBrowser);
use File::Temp qw(mkstemps);

use constant BUFFER_SIZE     => 4_096;

my ($fh1, $wavname) = mkstemps( "snd_XXXXXXXXXX", ".wav" );
my ($fh2, $mp3name) = mkstemps( "snd_XXXXXXXXXX", ".mp3" );

# system("echo \$QUERY_STRING");
system("./eventSound.cgi $wavname >sound.log 2>&1");
system("./lame $wavname $mp3name >sound.log 2>&1");

print header("audio/x-mp3");
binmode STDOUT;

open(MP3,"<$mp3name");
while ( read( MP3, $buffer, BUFFER_SIZE ) ) {
    print $buffer;
}
close MP3;

unlink $wavname;
unlink $mp3name;
