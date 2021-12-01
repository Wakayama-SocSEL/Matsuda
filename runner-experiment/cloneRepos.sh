#!/bin/sh

cd `dirname $0`
mkdir -p repos
jq -r ".[0:$1] | [.[].S__nameWithOwner] | unique | .[]" ./inputs.json |\
  xargs -i bash -c "git clone https://github.com/{}.git repos/{} && echo wait 1s && sleep 1";\
  exit 0
