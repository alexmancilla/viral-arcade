import type { GameModule } from "@viral/game-kit/core";

/**
 * Feature flags per game. Overrides win over the module's defaultEnabled.
 * Phase 1: the hub publishes this map as JSON and the app fetches it at launch.
 */
const overrides: Record<string, boolean> = {};

export function isEnabled(game: GameModule): boolean {
  return overrides[game.slug] ?? game.defaultEnabled;
}
