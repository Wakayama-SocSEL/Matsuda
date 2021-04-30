#!/bin/sh

if [ ! -e ./dataset/dataset.db ]; then
  ls -1 ./dataset/*.csv |\
    sed "s/\.csv//g" |\
    xargs -i sqlite3 -csv ./dataset/dataset.db ".import {}.csv {}"
fi
