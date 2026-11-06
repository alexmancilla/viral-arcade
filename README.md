# Viral Arcade

Mobile game factory: the team watches trends in the **Hub**, turns a trend into an **AppBrief**, and **Devin** builds the game into the Expo **Arcade** app.

```
trend sources -> Hub (catalog, briefs, approval) -> Devin session -> PR -> EAS preview -> Arcade (OTA) / store app
```

## Layout

| Path | What |
| --- | --- |
| `apps/arcade` | Expo (SDK 58, Expo Router) container app. Renders game modules from `src/registry.ts`, deep links `arcade://play/<slug>`. |
| `apps/hub` | Next.js team hub: Sources, Trends, Briefs, Builds, Games. Prisma + SQLite locally. |
| `packages/game-kit` | Shared mobile kit: timer, rounds, scoring, fuzzy matching, haptics, share, deep links, analytics, UI. |
| `packages/devin-client` | AppBrief schema, prompt builder, Devin v3 API client, `BuildDispatcher` (dry-run when no credentials). |
| `templates/*` | Archetype templates Devin copies (`guess_phrase`, `impostor`). |
| `games/*` | One folder per game (`reverse-it`, `impostor`). |
| `docs/` | Devin playbook + knowledge. |

## Run it

```bash
pnpm install
pnpm typecheck && pnpm test

# Hub
cd apps/hub && cp .env.example .env && pnpm db:push && pnpm db:seed && cd ../..
pnpm dev:hub            # http://localhost:3000

# Arcade on the Android emulator
pnpm dev:arcade -- --android
```

Set `DEVIN_API_KEY` + `DEVIN_ORG_ID` in `apps/hub/.env` to make "Approve" create real Devin sessions; without them the Hub records a dry run and still shows the exact request.

Dispatch a brief from the CLI: `pnpm devin:dispatch packages/devin-client/examples/reverse-it.brief.json --dry-run`.

Deploying the Hub (Vercel + Neon Postgres): see `docs/deploy-hub.md`.
