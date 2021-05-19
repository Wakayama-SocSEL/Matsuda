FROM node:14-slim
RUN apt update && apt install -y git jq
WORKDIR /workdir

COPY ./inputs.json .
ARG repos
RUN jq -r ".[0:$repos] | .[].nameWithOwner" ./inputs.json |\
  xargs -i bash -c "git clone https://github.com/{}.git repos/{} && echo wait 1s && sleep 1";\
  exit 0

COPY package.json /workdir/
COPY yarn.lock /workdir/
RUN yarn install

COPY . /workdir/
