FROM node:16.5.0-alpine3.12
WORKDIR /usr/src/app

COPY src/package*.json ./
RUN npm ci

COPY src .
CMD [ "node", "bin/www" ]
