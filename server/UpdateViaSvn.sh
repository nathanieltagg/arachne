#!/bin/bash

echo "UpdateViaSvn.sh"
source ~tagg/.bash_profile
svn --version
cd ..
pwd
svn update
