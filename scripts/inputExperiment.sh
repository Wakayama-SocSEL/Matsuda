#!/bin/sh

sqlite3 ./dataset/dataset.db -json \
  < ./scripts/sql/experiment.sql \
  > ./runner-experiment/inputs.json
