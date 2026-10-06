# ---------- build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate \
  && npm run build \
  && npm run build:seed \
  && npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3333

# Aplica as migrations, roda o seed (se SEED=true) e sobe a API.
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED\" = \"true\" ]; then node dist/prisma/seed.js; fi && node dist/server.js"]
