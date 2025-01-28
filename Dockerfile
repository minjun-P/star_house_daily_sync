# Stage 1: 빌드 환경
FROM node:20.18.1-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start:market_sync"]