#!/bin/sh

if [ ! -e ../dataset/dataset.db ]; then
  ls -1 *.csv |\
    sed "s/\.csv//g" |\
    xargs -i sqlite -csv dataset.db ".import {}.csv {}"
fi