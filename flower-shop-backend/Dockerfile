FROM node:22.12.0-alpine

WORKDIR /app

COPY flower-shop-backend/package*.json ./
RUN npm ci --omit=dev

COPY flower-shop-backend/server.js ./
COPY flower-shop-backend/data ./data
COPY flower-shop-backend/uploads ./uploads

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]

