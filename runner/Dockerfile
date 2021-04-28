FROM node:14-slim
RUN apt update && apt install -y git jq
WORKDIR /workdir

COPY ./inputs.json .
ARG repos=10
RUN jq -r ".repoNames[:$repos] | .[]" ./inputs.json |\
  xargs -i bash -c "git clone https://github.com/{}.git repos/{} && echo wait 1s && sleep 1";\
  exit 0

COPY . .
RUN chmod +x ./*.sh
