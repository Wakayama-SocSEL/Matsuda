#!/bin/sh

ls -1 ./output/*.csv |\
  sed 's/\.\/output\/\(.*\)\.csv/\1/g' |\
  xargs -i sqlite3 -csv ./dataset/dataset.db ".import ./output/{}.csv {}"
