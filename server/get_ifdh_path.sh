#!/bin/bash

. /grid/fermiapp/products/common/etc/setups.sh 2>&1 > /dev/null
setup ifdhc v1_8_11 2>&1 > /dev/null

which ifdh 2>&1
