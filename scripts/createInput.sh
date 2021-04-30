#!/bin/sh

sqlite3 ./dataset/dataset.db -json \
  < ./scripts/sql/inputs.sql \
  > ./runner/inputs.json
