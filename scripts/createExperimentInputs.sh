#!/bin/sh

sqlite3 ./dataset/dataset.db -json \
  < ./scripts/sql/experimentInputs.sql \
  > ./runner/experimentInputs.json
