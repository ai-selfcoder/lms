# syntax=docker/dockerfile:1
# Next.js web (frontend + BFF API routes).
#
# Build context MUST be the `site/` directory (the parent of web/ and content/),
# because the app reads the shared content tree at ../content via fs — both at
# build (static generation) and at runtime (SSR). The content is baked into the
# image so the container has no host-path dependencies.
#
#   docker build -f deploy/web.Dockerfile -t app-web .   # run from site/
#
# NEXT_PUBLIC_* is inlined into the client bundle at build time, so the public
# API URL must be passed as a build ARG (not just a runtime env var).

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app/web

# Public/runtime config needed during `next build`.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    SITE_URL=$SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY web/package.json web/package-lock.json ./
# Persist npm's cache across builds so unchanged deps don't re-download.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

COPY web/ ./
# Shared content tree, read via ../content from the web dir.
COPY content/ /app/content/

# Persist Next's incremental build cache (.next/cache) across builds. This is the
# big one: content-only / page-only changes reuse webpack+SWC compilation instead
# of rebuilding cold. Requires BuildKit (Coolify uses it by default).
RUN --mount=type=cache,target=/app/web/.next/cache \
    npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app/web
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone server + static assets (Next "output: standalone").
# NOTE: `output: standalone` does NOT bundle public/ or .next/static — both must
# be copied explicitly. Missing public/ means /play/play.wasm (the playground
# WASM) 404s in production.
COPY --from=build /app/web/.next/standalone ./
COPY --from=build /app/web/.next/static ./.next/static
COPY --from=build /app/web/public ./public
# Content baked alongside, so `path.resolve(cwd, "..", "content")` → /app/content.
COPY --from=build /app/content /app/content

EXPOSE 3000
# server.js runs from /app/web → cwd is /app/web → ../content resolves correctly.
CMD ["node", "server.js"]
