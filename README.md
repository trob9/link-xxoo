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
- Uploadable profile picture (server-side WebP conversion, circle/rounded/square, show-hide toggle)
- Social icon row, drag-orderable (Instagram, X, TikTok, YouTube, Twitch, GitHub, LinkedIn, Facebook, website, email)
- Per-profile background texture (plain / dots / grid), drawn in CSS with no image assets
- Live theme preview in the editor, staggered link entrance, and `prefers-reduced-motion` support

## Local development

```bash
npm install
npx prisma migrate dev   # first time only — creates dev.db
npm run dev
```

Open http://localhost:3000. The app runs fully without OAuth credentials set —
you just can't complete a sign-in until you add them (see below).

## Sign-in providers

Discord and Google are both supported, and **each is its own account**: a
Google sign-in never joins an existing Discord account even when the email
address matches. Identity is the `(provider, providerAccountId)` pair, never
the email — so control of a mailbox can't get anyone into someone else's
profile.

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

## Google OAuth setup (manual step required)

1. Go to https://console.cloud.google.com/auth/clients and create an
   **OAuth client ID** of type *Web application*.
2. **Authorized JavaScript origins** — scheme + host only, no path:
   - `http://localhost:3000` (local dev)
   - `https://link.xxoo.ooo` (production)
3. **Authorized redirect URIs** — Auth.js mounts at `/api/auth`, and the
   provider callback is always `/api/auth/callback/<provider id>`:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://link.xxoo.ooo/api/auth/callback/google` (production)
4. Publish the app on the **Audience** screen, otherwise only test users
   you list by hand can sign in.
5. Put the values in `.env` (local) or `.env.production` (deploy host):
   ```
   AUTH_GOOGLE_ID="your client id"
   AUTH_GOOGLE_SECRET="your client secret"
   ```

Google serves profile pictures from `lh3.googleusercontent.com`, so the
deploy host's `Content-Security-Policy` (`img-src`) has to allow it — see
the site's entry in the deployment framework's `sites.yaml`.

## Tests

```bash
npm test          # vitest — unit tests for validation/theme logic
npm run test:e2e  # playwright — builds, starts, and drives the real app
```

## Deploying (mini-PC / any Docker host)

This runs in production at https://link.xxoo.ooo, behind a reverse proxy on a
shared Docker network. The production container is **not** started from the
`docker-compose.yml` in this repo — that file publishes `3000:3000` on the
host and declares no external network, which is the right shape for a
standalone host but not for a proxied one. In production the container joins
the proxy's network instead and publishes no ports at all:

```bash
cp .env.production.example .env.production   # fill in AUTH_SECRET / Discord creds
docker build -t link-xxoo:latest .
docker run -d --name link-xxoo --network <proxy-network> \
  -v link-xxoo-data:/app/data --env-file .env.production \
  --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID --cap-add SETPCAP \
  --security-opt no-new-privileges --restart unless-stopped \
  link-xxoo:latest
```

For a standalone host with nothing else in front of it, the bundled compose
file is still the quickest path:

```bash
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

## License

MIT — see [LICENSE](./LICENSE).
