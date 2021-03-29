FROM node:14-slim

RUN apt update && apt install -y curl jq
RUN curl -fsSL https://get.docker.com/ | sh
