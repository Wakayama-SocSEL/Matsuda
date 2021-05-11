#!/bin/sh

if [ ! -e ./dataset/dataset.db ]; then
  ls -1 ./dataset/*.csv |\
    sed 's/\.\/dataset\/\(.*\)\.csv/\1/g' |\
    xargs -i sqlite3 -csv ./dataset/dataset.db ".import ./dataset/{}.csv {}"
  sqlite3 ./dataset/dataset.db < ./scripts/sql/createIndex.sql
fi
