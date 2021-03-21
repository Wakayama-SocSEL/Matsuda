FROM node:14-slim
RUN apt update && apt install -y git
WORKDIR /workdir
COPY ./runTest.sh ./
RUN chmod +x ./runTest.sh
ENTRYPOINT ["./runTest.sh"]
