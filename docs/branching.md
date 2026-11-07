# Branching and release strategy

Two long-lived branches, both protected; everything else is short-lived.

| Branch | Purpose | Deploys to | Database |
| --- | --- | --- | --- |
| `main` | Production. Only receives release PRs from `develop` (and hotfixes). | Vercel **Production** (`hub` project) · arcade: EAS channel `production` | Neon branch `main` |
| `develop` | Integration. Default target for every feature/game PR. | Vercel **Preview** for `develop` (stable staging URL) · arcade: EAS channel `preview` | Neon branch `develop` |
| `feat/<slug>`, `fix/<slug>`, `devin/<ts>-<slug>` | One change each: a new game, a Hub feature, a fix. Opened as a PR into `develop`. | Vercel per-PR preview (ephemeral) | Neon `develop` (or a per-PR Neon branch later) |
| `hotfix/<slug>` | Urgent production fix. PR into `main`, then back-merged into `develop`. | — | — |

## Rules

- Nobody pushes to `main` or `develop` directly; PRs only, with CI (`check` job) and Devin Review green, 1 approval for `main`.
- Devin game sessions (from the Hub) branch from `develop` and open PRs into `develop`; a game is "live in staging" when it is merged there and its flag is enabled on the staging Hub.
- Releasing = open a PR `develop → main` titled `release: <date or version>`, squash-free merge (merge commit) so `main` history matches `develop`. Tag `v<major.minor>` on `main` for store releases of the arcade binary.
- Hotfix: branch from `main`, PR into `main`, then open `main → develop` to keep them in sync.
- Database: schema changes land on `develop` first (`prisma db push` on the Neon `develop` branch, run by the Vercel build); the release PR applies them to the Neon `main` branch when `main` deploys. Move to `prisma migrate deploy` before the first external users.
- Secrets never live in git: Vercel env vars per environment (Production = `main`, Preview = `develop` and PRs), GitHub Actions secrets for EAS, Devin org secrets for automation.

## GitHub settings (one-time, repo admin)

Settings → Branches → add rules for `main` and `develop`:
- Require a pull request before merging (`main`: 1 approval; `develop`: 0 approvals is fine while the team is small)
- Require status checks to pass: `check` (CI) and `Devin Review`
- Require branches to be up to date before merging
- Do not allow bypassing the above settings; block force pushes and deletions

Set `develop` as the repository **default branch** so new PRs target it automatically.
