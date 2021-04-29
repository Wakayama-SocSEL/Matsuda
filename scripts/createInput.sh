#!/bin/sh

./createDB.sh
sqlite3 ../dataset/dataset.db -json < ./sql/input1.sql > inputs.json
