import type { GameModule } from "@viral/game-kit/core";
import impostor from "@games/impostor";
import reverseIt from "@games/reverse-it";

/**
 * Every game the arcade can show. Devin adds one line per new game.
 * Order is the order on the home screen.
 */
export const games: GameModule[] = [reverseIt, impostor];

export function findGame(slug: string | undefined): GameModule | undefined {
  return games.find((g) => g.slug === slug);
}
