#!/bin/sh

cat ./input.json |\
  jq -r '.repoNames[]' |\
  xargs -i git clone https://github.com/{}.git repos/{}
