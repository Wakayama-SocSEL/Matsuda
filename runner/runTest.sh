#!/bin/sh

git clone $1 repo && \
  cd repo &&
  git reset $2 --hard &&
  (npm ci || npm install) &&
  npm test
