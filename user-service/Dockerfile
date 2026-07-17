FROM node:18-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --production

COPY server.js .
# Proto definitions are volume mounted via docker-compose

CMD ["node", "server.js"]
