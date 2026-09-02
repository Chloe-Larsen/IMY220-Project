FROM node:24-alpine

WORKDIR /backend

COPY package*.json ./

RUN npm install

COPY . . 

EXPOSE 5000

CMD [ "node", "server.js" ]