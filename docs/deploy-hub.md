# Deploying the Hub (Vercel + Neon Postgres)

The Hub is a plain Next.js app in `apps/hub`. Locally it uses SQLite (`prisma/schema.prisma`);
in production it uses Postgres via `prisma/schema.postgres.prisma` (same models, checked by a test).

## One-time setup

1. **Neon**: create a project at https://console.neon.tech, copy the *pooled* connection string.
2. **Vercel**: import the GitHub repo, set **Root Directory** to `apps/hub` (keep "Include source files outside of the Root Directory" on so the pnpm workspace resolves). `apps/hub/vercel.json` sets install/build commands (`pnpm vercel-build` = generate client → `prisma db push` → `next build`).
3. Environment variables on the Vercel project:
   - `DATABASE_URL` — Neon pooled URL
   - `HUB_USER`, `HUB_PASSWORD` — Basic auth for the team (leave `HUB_PASSWORD` empty only for local dev)
   - `DEVIN_API_KEY`, `DEVIN_ORG_ID`, `DEVIN_PLAYBOOK_ID`, `ARCADE_REPO` — enable real Devin dispatch (empty = dry run)
   - `YOUTUBE_API_KEY` — optional collector
4. Seed once from your machine: `cd apps/hub && DATABASE_URL=<neon url> pnpm db:seed:pg`.

## CLI deploy

```bash
npm i -g vercel
cd apps/hub && vercel link && vercel env pull && vercel --prod
```

## Notes

- `prisma db push` in the build is fine for Phase 0; switch to `prisma migrate deploy` once the schema stabilizes.
- The arcade app reads `https://<hub-domain>/api/flags` (public, no auth) — set that URL in `apps/arcade/src/flags.ts` when wiring remote flags.
- Collectors run on demand ("Run now"); add a Vercel Cron hitting `/api/sources/run` later for scheduled collection.
