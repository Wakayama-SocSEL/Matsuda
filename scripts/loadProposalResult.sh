#!/bin/sh

sqlite3 ./dataset/dataset.db "DROP TABLE IF EXISTS proposal_result"
sqlite3 -csv ./dataset/dataset.db ".import ./output/proposal_result.csv proposal_result"
