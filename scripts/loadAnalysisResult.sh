#!/bin/sh

sqlite3 ./dataset/dataset.db "DROP TABLE IF EXISTS repository_versions"
sqlite3 ./dataset/dataset.db "DROP TABLE IF EXISTS analysis_result"
sqlite3 -csv ./dataset/dataset.db ".import ./output/repository_versions.csv repository_versions"
sqlite3 -csv ./dataset/dataset.db ".import ./output/analysis_result.csv analysis_result"
sqlite3 ./dataset/dataset.db "CREATE INDEX repo__npm_pkg_idx ON analysis_result(repo__npm_pkg);"
sqlite3 ./dataset/dataset.db "CREATE INDEX data__success_run_rate_idx ON analysis_result(data__success_run_rate);"
