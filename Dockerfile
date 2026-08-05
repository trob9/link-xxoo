# Multi-stage build for a self-hosted deploy (mini-PC / any Docker host).
# Debian-based (not alpine) throughout so the better-sqlite3 native addon
# doesn't need a musl rebuild at runtime.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# Separate prod-only install for the runner image: excludes devDependencies
# (typescript, vitest, playwright, eslint, ...) that the app never needs at
# runtime. `prisma`, `@prisma/client`, `@prisma/adapter-better-sqlite3`, and
# `dotenv` are real dependencies, so this still pulls in everything
# `prisma migrate deploy` needs to load prisma.config.ts (@prisma/config's
# own transitive deps, e.g. c12 -> jiti, come along automatically).
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV DOCKER_BUILD=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# bookworm-slim ships without libssl; Prisma's schema engine
# (schema-engine-debian-openssl-3.0.x, bundled in @prisma/engines) needs it,
# and without it Prisma tries to fetch a different engine at runtime and
# fails ("Can't write to node_modules/@prisma/engines") since it runs as the
# unprivileged nextjs user. Installing openssl lets it use the bundled engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Standalone's own node_modules is pruned to just the Next.js server's
# runtime deps and doesn't include the prisma CLI — layer the full prod
# install on top so `prisma migrate deploy` in the entrypoint also works.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/data && chown -R nextjs:nextjs /app/data

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/prod.db"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
