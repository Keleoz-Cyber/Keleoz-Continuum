# syntax=docker/dockerfile:1.7

FROM node:24-alpine3.22 AS base
ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/corepack
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable \
  && addgroup -S -g 1001 continuum \
  && adduser -S -u 1001 -G continuum continuum
WORKDIR /app

FROM base AS dependencies
ARG NPM_REGISTRY=https://registry.npmjs.org/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm config set registry "$NPM_REGISTRY" \
  && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /corepack /corepack
COPY . .
ENV NODE_ENV=production
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ENV SESSION_SECRET=build-only-session-secret-0000000000000000
ENV SITE_ORIGIN=http://127.0.0.1:3000
ENV MEDIA_DRIVER=local
ENV MEDIA_LOCAL_ROOT=/app/var/media
ENV AI_GATEWAY_ENABLED=false
# Preserve valid source CSS (including ::highlight) across builder environments.
RUN pnpm exec next build --webpack

FROM base AS tooling
USER root
RUN apk add --no-cache postgresql17-client
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /corepack /corepack
COPY --chown=continuum:continuum . .
RUN mkdir -p /app/var/backups /app/var/media \
  && chown -R continuum:continuum /app/var
USER continuum
CMD ["pnpm", "db:migrate"]

FROM node:24-alpine3.22 AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=1536
RUN addgroup -S -g 1001 continuum \
  && adduser -S -u 1001 -G continuum continuum
WORKDIR /app
COPY --from=builder --chown=continuum:continuum /app/.next/standalone ./
COPY --from=builder --chown=continuum:continuum /app/.next/static ./.next/static
COPY --from=builder --chown=continuum:continuum /app/public ./public
COPY --from=builder --chown=continuum:continuum /app/NOTICE.md ./NOTICE.md
RUN mkdir -p /app/var/media /app/var/backups /app/.next/cache \
  && chown -R continuum:continuum /app/var /app/.next/cache
USER continuum
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=6s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
