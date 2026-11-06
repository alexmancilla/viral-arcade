import type { GameModule } from "@viral/game-kit/core";
import { GuessPhraseGame } from "./src/Game";
import { config } from "./src/config";

const game: GameModule = {
  slug: config.slug,
  title: config.title,
  tagline: config.tagline,
  archetype: "guess_phrase",
  version: "0.1.0",
  defaultEnabled: true,
  component: GuessPhraseGame,
};
export default game;
