#!/bin/sh

cd repos/$1 &&\
  git reset $2 --hard &&\
  npm ls --json 2>/dev/null |\
  jq '.dependencies | to_entries | map({ (.key): .value.version }) | add'
