#!/bin/sh

git clone $1 repo && \
  cd repo &&
  git log --reverse --date-order --pretty="%H" |\
  xargs -Ihash bash -c "git show hash:package.json 2>/dev/null | jq '.version' | xargs -Iversion echo version hash"
