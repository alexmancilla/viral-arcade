# Viral game builder

## Overview
Build one game module in the arcade monorepo from an AppBrief JSON, verify it on a device emulator, open a PR, report structured output.

## What's needed from the user
- The AppBrief JSON inside `<brief>` tags in the prompt. If it is missing or fails `AppBriefSchema` (packages/devin-client/src/brief.ts), stop and report `status=blocked`.

## Procedure
1. Read the brief. Confirm `templates/<archetype>` exists; if not, use `templates/guess_phrase` as the base and say so in notes.
2. Copy the template to `games/<slug>` and replace `__SLUG__`, `__TITLE__`, `__PITCH__`. Register the game in `apps/arcade/src/registry.ts` with `defaultEnabled: false`.
   Never edit other games, `packages/*` or the app shell in this session; open a GitHub issue describing the change instead.
3. Implement the mechanic in `games/<slug>/src` using `@viral/game-kit` (timer, rounds, scoring, haptics, share, deep link). Do not reimplement kit features. Keep `config.ts` as the place brief values live.
4. Generate content from `content_spec` into `games/<slug>/content/*.json`. Respect every constraint in the brief (no copyrighted audio, no platform logos, permission strings for mic or camera).
5. Emit analytics only through the `analytics` prop (`game_start`, `game_end`, `share_click`, `invite_opened`, `game_exit`). Do not add trackers or native modules. If a native module is truly required, stop and report `status=blocked` with the reason.
6. Run `pnpm install`, `pnpm typecheck`, `pnpm test`. Start the Android emulator, run `pnpm --filter arcade start` with the dev client (or Expo Go), play through every screen, and save a screenshot per screen. Write `games/<slug>/e2e/smoke.yaml` (Maestro) and run it.
7. Publish a preview when EAS is configured: `cd apps/arcade && eas update --branch pr-<slug> --message "<brief_id>"`. Put the branch name in the PR. Skip without failing if `EXPO_TOKEN` is absent.
8. Open a PR titled `game(<slug>): <pitch>` with the screenshots, test output and preview branch.
9. Provide structured output: `status`, `slug`, `pr_url`, `preview_channel`, `verified_on`, `blockers`, `notes`.

## Forbidden actions
- Merging, `eas build`, `eas submit`, touching credentials, `app.json` native settings or CI, scraping any website, adding dependencies above 500 KB.

## Specifications
- Portrait only, 60 fps on a mid-range Android, cold start under 2 s inside the container, works offline except invites, strings in en and es where content allows.
