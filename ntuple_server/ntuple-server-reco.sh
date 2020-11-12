#!/bin/bash

# Keep these in sync with build-server-reco.sh
# TODO: DRY
mnvsoftVersion=v22r1p1
buildDir=/home/minervapro/gaudi-server-for-arachne


oldpwd=$(pwd)

. /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/setup.sh
#cd /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/minerva/MINERVA/MINERVA_${mnvsoftVersion}/Tools/ProductionScripts/cmt
cd $buildDir/Tools/ProductionScriptsLite/cmt
. setup.sh;
#cd /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/lhcb/LHCB/LHCB_v33r0p1b_lcgcmake/RootCnv/cmt
#. setup.sh;
cd $buildDir/Tools/eventLoopHack/cmt/
. setup.sh
cd $oldpwd

SystemTestsApp.exe $EVENTLOOPHACKROOT/options/Run_eventLoopHack.opts

