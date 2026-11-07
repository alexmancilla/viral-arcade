# Build a viral game from an AppBrief (mirror of the Devin skill `build-viral-game`)

## Overview
The Hub (viral-arcade-hub.vercel.app) approves an AppBrief and starts a Devin session with it. This skill turns that brief into one game module under `games/<slug>` in `github.com/alexmancilla/viral-arcade`, verified on the Android emulator, delivered as a PR into `develop`. The arcade container app ships it over the air once the team enables its flag in the Hub.

## What's needed from the user
- The AppBrief JSON inside `<brief>` tags in the prompt (schema: `packages/devin-client/src/brief.ts`, `AppBriefSchema`). If it is missing or invalid, stop and return `status=blocked` with the validation error.

## Procedure
1. Branch from `develop`: `git fetch origin && git checkout -b devin/<brief_id>-<slug> origin/develop`. Never branch from or target `main`.
2. Read the brief. Confirm `templates/<archetype>` exists (`guess_phrase`, `impostor`); if not, start from `templates/guess_phrase` and say so in `notes`.
3. Copy the template to `games/<slug>`, set `package.json` name to `@games/<slug>`, fill `src/config.ts` from the brief (title, pitch, rules, round timing, share mechanic) and register the module in `apps/arcade/src/registry.ts` with `defaultEnabled: false`. Run `pnpm install` so the workspace links it.
4. Implement the mechanic in `games/<slug>/src/Game.tsx` with `@viral/game-kit` only (`useCountdown`, `roundsReducer`, `speedScore`, `isMatch`, `haptics`, `shareChallenge`, `encodeInvite`, UI primitives). Do not reimplement kit features and do not edit `packages/*`, other games or `apps/arcade` beyond the registry line; if the kit lacks something, note it in `blockers`/`notes` and work around it inside the game folder.
5. Generate content from `content_spec` into `games/<slug>/content/*.json` (en and es when the content allows). Respect every `constraints` entry (no copyrighted audio, no platform logos, no new permissions).
6. Emit analytics only through the `analytics` prop (`game_start`, `game_end`, `share_click`, `invite_opened`, `game_exit`). No trackers, no native modules; a mechanic that truly needs a native module ends the session with `status=blocked` and the reason.
7. Verify: `pnpm typecheck && pnpm test`; start the emulator (`emulator -avd arcade -no-window -no-audio -gpu swiftshader_indirect -no-snapshot &`, `adb wait-for-device`); `cd apps/arcade && EXPO_PUBLIC_HUB_URL=http://10.0.2.2:3000 npx expo start --android`; play every screen and save one screenshot per screen (`adb exec-out screencap -p`). Write `games/<slug>/e2e/smoke.yaml` (Maestro, `appId: com.viral.arcade`) and run it with `appId: host.exp.exponent` and no `launchApp` while inside Expo Go.
8. Open a PR into `develop` titled `game(<slug>): <pitch>` with the screenshots and test output. Do not merge; OTA publishing happens automatically when `develop` merges.
9. Return structured output: `status` (`pr_opened` | `blocked` | `failed`), `slug`, `pr_url`, `preview_channel` (`preview`), `verified_on` (`["android_emulator"]`), `blockers`, `notes`.

## Specifications
- One new folder `games/<slug>` plus one registry line; CI (`check`) green; Maestro smoke flow passes; game is reachable at `arcade://play/<slug>` and hidden from Home until the Hub enables it.
- Portrait only, works offline except invites, cold start under 2 s inside the container, strings in en (and es where the content allows).
- Validation: `pnpm typecheck && pnpm test` pass locally, the smoke flow passes on the emulator, and the PR shows a screenshot of every screen.

## Advice and pointers
- Shells do not load NVM automatically: start commands with `export NVM_DIR=$HOME/.nvm; . $NVM_DIR/nvm.sh`.
- The Hub reads flags from `/api/flags`; `apps/arcade/src/flags.ts` already handles it, nothing to do in the game.
- Keep brief values in `config.ts`, not scattered in components, so iteration briefs (`parent_game`) stay small diffs.
- An iteration brief (`parent_game` set) modifies that existing game folder instead of creating a new one.
- Voice/singing games: use `usePitch`, `centsOff`, `midiToNoteName` from `@viral/game-kit` (backed by react-native-pitchy, in the arcade binary since 1.1.0). Show a "update the Arcade app" message when `available` is false; never add your own audio module.

## Forbidden actions
- Merging PRs, pushing to `main` or `develop`, `eas build`, `eas submit`, `eas update`, editing `app.json`/`eas.json`/CI, touching secrets or environment variables, scraping websites, adding dependencies over 500 KB or any native module.
