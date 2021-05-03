#!/bin/sh

sqlite3 ./dataset/dataset.db -json \
  < ./scripts/sql/analysis.sql \
  > ./runner-analysis/inputs.json
