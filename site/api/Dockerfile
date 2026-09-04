# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
# Prisma's engine needs OpenSSL present (Alpine ships none by default).
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
# `prisma migrate deploy` (CMD) runs the schema engine here — needs OpenSSL too.
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Apply migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
