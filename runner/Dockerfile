FROM node:14-slim
RUN apt update && apt install -y git jq
WORKDIR /workdir
COPY . .
RUN chmod +x ./*.sh && ./cloneRepos.sh
