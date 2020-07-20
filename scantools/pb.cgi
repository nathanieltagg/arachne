#!/usr/bin/perl
        use strict;
        use warnings;
        use CGI::ProgressBar qw/:standard/;
        $| = 1; # Do not buffer output
        print header,
                start_html(
                        -title=>'A Simple Example',
                        -style=>{
                                -src  => '', # You can override the bar style here
                                -code => '', # or inline, here.
                        }
                ),
                h1('A Simple Example'),
                p('This example will update a JS/CSS progress bar.'),
                progress_bar( -from=>1, -to=>100 );
        # We're set to go.
        for (1..10){
                print update_progress_bar;
                # Simulate being busy:
                sleep 1;
        }
        # Now we're done, get rid of the bar:
        print hide_progress_bar;
        print p('All done.');
        print end_html;
        exit;
