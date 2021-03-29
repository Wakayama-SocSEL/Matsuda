FROM node:14-slim
RUN apt update && apt install -y git jq
WORKDIR /workdir

COPY ./input.json .
RUN jq -r '.repoNames[]' ./input.json |\
  xargs -i git clone https://github.com/{}.git repos/{}

COPY . .
RUN chmod +x ./*.sh
