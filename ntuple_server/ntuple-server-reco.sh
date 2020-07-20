#!/bin/bash

# Keep these in sync with build-server-reco.sh
# TODO: DRY
mnvsoftVersion=v21r1p1
buildDir=/minerva/app/home/minervapro/arachne-ntuple-server


oldpwd=$(pwd)

. /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/setup.sh
cd /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/minerva/MINERVA/MINERVA_${mnvsoftVersion}/Tools/ProductionScripts/cmt
. setup.sh;
cd $buildDir/Tools/eventLoopHack/cmt/
. setup.sh
cd $oldpwd

SystemTestsApp.exe $EVENTLOOPHACKROOT/options/Run_eventLoopHack.opts

