#!/bin/sh

if [ ! -e ../dataset/dataset.db ]; then
  ls -1 *.csv |\
    sed "s/\.csv//g" |\
    xargs -i sqlite -csv dataset.db ".import {}.csv {}"
fi

QUERY="
SELECT
  npm_pkg,
  nameWithOwner,
  hasTestScript,
  npms_score
FROM pkg_repositories
  WHERE hasTestScript=1
  ORDER BY npms_score DESC
"

sqlite3 ../dataset/dataset.db -json "$QUERY" > inputs.json
