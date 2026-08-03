# link.xxoo.ooo

A link-in-bio product (Linktree-style) with Discord OAuth login. Built with
Next.js 16 (App Router), Prisma 7 (SQLite via a driver adapter), Auth.js v5,
and a warm neobrutalist design system that deliberately avoids the generic
blue/purple-gradient "AI-built" look.

## Features

- Discord-only sign-in (Auth.js v5, JWT sessions)
- Public profile page at `/{username}` with unlimited links
- Link scheduling (start/end windows), enable/disable, drag-to-reorder, featured/pinned links
- Six built-in themes (Dawn, Ink, Riso, Paper, Neon Grid, Citrus) plus per-profile accent/button-style overrides
- Click analytics (per-link totals + 14-day trend)
- QR code export of your public profile URL
- vCard "save contact" button on public profiles
- Per-profile SEO title/description
- Sensitive-content interstitial gate
- Social icon row (Instagram, X, TikTok, YouTube, Twitch, GitHub, LinkedIn, website, email)

## Local development

```bash
npm install
npx prisma migrate dev   # first time only — creates dev.db
npm run dev
```

Open http://localhost:3000. The app runs fully without Discord credentials set —
you just can't complete a sign-in until you add them (see below).

## Discord OAuth setup (manual step required)

This app's Discord login code is fully wired up, but a **real Discord
application** has to be created by hand — Discord doesn't have an API for
this, only their web Developer Portal, and creating it requires an
interactive, authenticated browser session.

1. Go to https://discord.com/developers/applications and click **New Application**.
2. Name it (e.g. "link.xxoo.ooo") and create it.
3. Go to **OAuth2 → General**. Copy the **Client ID** and generate/copy a **Client Secret**.
4. Under **OAuth2 → Redirects**, add:
   - `http://localhost:3000/api/auth/callback/discord` (local dev)
   - `https://link.xxoo.ooo/api/auth/callback/discord` (production)
5. Put the values in `.env` (local) or `.env.production` (deploy host):
   ```
   AUTH_DISCORD_ID="your client id"
   AUTH_DISCORD_SECRET="your client secret"
   ```
6. Restart the dev server / redeploy. Discord login now works end-to-end.

## Tests

```bash
npm test          # vitest — unit tests for validation/theme logic
npm run test:e2e  # playwright — builds, starts, and drives the real app
```

## Deploying (mini-PC / any Docker host)

This repo ships a production `Dockerfile` + `docker-compose.yml`, but **has
not been deployed** — deploys for this project happen from the host that
actually serves public traffic, not from a laptop.

```bash
cp .env.production.example .env.production   # fill in AUTH_SECRET / Discord creds
docker compose up -d --build
```

The container writes its SQLite database to a named volume
(`link-xxoo-data`) at `/app/data/prod.db`, and runs `prisma migrate deploy`
automatically on start. Point your reverse proxy at container port `3000`
for `link.xxoo.ooo`. If you outgrow SQLite (multiple app instances, heavier
write load), swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg`
in `src/lib/prisma.ts`, change the `datasource` provider in
`prisma/schema.prisma` to `"postgresql"`, and point `DATABASE_URL` at a
Postgres instance — the rest of the app is unaffected.

## Tech stack notes

- **Next.js 16**: middleware is renamed `proxy.ts` in this version (see
  `src/proxy.ts`, which guards `/dashboard/*`); `params`/`searchParams` are
  Promises throughout.
- **Prisma 7**: uses the newer `prisma-client` generator + a
  `@prisma/adapter-better-sqlite3` driver adapter (see `src/lib/prisma.ts`)
  rather than the older embedded query-engine binary.
- **Tailwind v4**: CSS-first config — there's no `tailwind.config.*`, design
  tokens live in `src/app/globals.css`.
