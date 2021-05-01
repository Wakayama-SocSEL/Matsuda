#!/bin/sh

cd repos/$1 &&\
  git reset $2 --hard &&\
  (npm ci || npm install) &&\
  npm test
