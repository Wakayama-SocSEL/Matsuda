FROM node:14-slim

RUN apt update && apt install -y curl jq unzip gcc git
RUN curl -fsSL https://test.docker.com/ | sh

# https://sqlite.org/howtocompile.html
RUN curl https://www.sqlite.org/2021/sqlite-amalgamation-3350500.zip -o sqlite.zip &&\
  unzip sqlite.zip &&\
  cd sqlite-amalgamation-3350500 &&\
  gcc -DSQLITE_THREADSAFE=0 -DSQLITE_OMIT_LOAD_EXTENSION shell.c sqlite3.c &&\
  mv ./a.out /usr/local/bin/sqlite3 &&\
  rm -rf /sqlite.zip /sqlite-amalgamation-3350500
