# Multi-stage build for a self-hosted deploy (any Docker host).
# Alpine (musl) runtime: the Debian base carries OS-package CVEs that have no
# upstream fix, Alpine does not. better-sqlite3, sharp and Prisma's schema
# engine all ship musl builds; compilers are only installed in the build
# stages (as a fallback if a prebuilt binary is missing).

FROM node:26-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package.json package-lock.json ./
RUN npm ci

# Separate prod-only install for the runner image: excludes devDependencies
# (typescript, vitest, playwright, eslint, ...) that the app never needs at
# runtime. `prisma`, `@prisma/client`, `@prisma/adapter-better-sqlite3`, and
# `dotenv` are real dependencies, so this still pulls in everything
# `prisma migrate deploy` needs to load prisma.config.ts.
FROM node:26-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:26-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV DOCKER_BUILD=1
RUN npm run build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# openssl: Prisma's schema engine (linux-musl-openssl-3.0.x, bundled in
# @prisma/engines) needs libssl; without it Prisma tries to download another
# engine at runtime and fails as the unprivileged user.
# npm/npx/corepack/yarn are removed from the runtime image: the entrypoint runs the
# local prisma binary directly, and npm bundles its own (CVE-prone) dependencies.
RUN apk upgrade --no-cache && apk add --no-cache openssl \
  && adduser -S -u 1001 -H nextjs \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Standalone's own node_modules is pruned to just the Next.js server's
# runtime deps and doesn't include the prisma CLI - layer the full prod
# install on top so `prisma migrate deploy` in the entrypoint also works.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/data && chown -R nextjs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/prod.db"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
