FROM node:16-slim As build
WORKDIR /app
COPY package*.json ./

RUN npm install --production

FROM node:16-slim
WORKDIR /app

COPY --from=build /app /app
COPY . /app

RUN npm ci --production
Expose 5000
CMD ["node", "index.js"]

