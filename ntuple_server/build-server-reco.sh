#!/bin/bash

mnvsoftVersion=v22r1p1

buildDir=/home/minervapro/gaudi-server-for-arachne

setupScript=/cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/setup.sh

if [ ! -e ${setupScript} ]; then
    echo "Can\'t find setup script ${setupScript}. Bailing"
    exit 1
fi

if [ "$USER" != "minervapro" ]; then
    echo You must run this script as minervapro. You are currently $USER
    exit 1
fi

. ${setupScript}

echo "Setup script ${setupScript}"

curpwd=`pwd`;
oldpwd=$OLDPWD;
cd /cvmfs/minerva.opensciencegrid.org/minerva/software_releases/${mnvsoftVersion}/minerva/MINERVA/MINERVA_${mnvsoftVersion}/Tools/ProductionScripts/cmt;
. setup.sh;
cd $oldpwd;
cd $curpwd;


mkdir -p $buildDir/cmt
mkdir -p $buildDir/Tools

cat > $buildDir/cmt/project.cmt <<EOF
 project $(basename $buildDir)

 use MINERVA MINERVA_${mnvsoftVersion}
EOF

cd $buildDir/Tools

cvs co -d ProductionScriptsLite Tools/ProductionScriptsLite
cd ProductionScriptsLite/cmt
cmt config
source setup.sh
cmt make

cd $buildDir/Tools
# TODO: "eventLoopHack" is not a very meaningful name. Plus, it's less of a hack now
cvs co -d eventLoopHack Personal/rodriges/eventLoopHack

cd eventLoopHack/cmt

cmt config
. setup.sh
make
