FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY extensions ./extensions
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN apk add --no-cache wget
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/extensions ./extensions

RUN mkdir -p /app/prisma/data

ENV DATABASE_URL="file:/app/prisma/data/prod.sqlite"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.mjs"]
