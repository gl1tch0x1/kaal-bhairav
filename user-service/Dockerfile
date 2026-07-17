FROM node:18-alpine
WORKDIR /app

# Cache package dependencies
COPY user-service/package.json ./
RUN npm install --production

# Copy proto definitions for build-time availability
COPY proto ./proto

# Copy service source code
COPY user-service/server.js .

CMD ["node", "server.js"]
