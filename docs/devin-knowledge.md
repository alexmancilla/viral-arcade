# Arcade monorepo: facts Devin needs (upload as Knowledge, trigger: "arcade repo")

- pnpm 9 workspace with hoisted node_modules (`.npmrc`). Install with `pnpm install` at the root. Node 20.
- Layout: `apps/arcade` (Expo Router shell), `apps/hub` (Next.js team dashboard), `games/*` (one package per game, `@games/<slug>`), `templates/*` (copy source for new games), `packages/game-kit` (shared mechanics and UI), `packages/devin-client` (brief schema and Devin API wrapper).
- A game exports a default `GameModule` from `games/<slug>/index.ts`; the shell renders `module.component` at `/play/<slug>` and passes `{ invite, analytics, onExit }`.
- Challenge links: `https://arcade.example.com/play/<slug>?invite=<token>`; token is base64url JSON `{ g, s, sc?, n? }` (see `packages/game-kit/src/core/deeplink.ts`).
- Checks: `pnpm typecheck`, `pnpm test` (vitest in game-kit and devin-client; games may add tests), `pnpm --filter arcade e2e` runs Maestro flows from `games/*/e2e`.
- Android emulator: `emulator -avd arcade -no-window -no-audio &`, then `pnpm --filter arcade android` for a dev build or `pnpm --filter arcade start` and press `a`.
- Expo SDK 58, React Native 0.88, React 19.3, TypeScript 5.9. New native modules need a store release; prefer kit features.
