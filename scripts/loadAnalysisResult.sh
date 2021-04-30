#!/bin/sh

sqlite3 -csv ./dataset/dataset.db ".import ./output/analysis_result.csv analysis_result"
