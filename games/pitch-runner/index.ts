import type { GameModule } from "@viral/game-kit/core";
import { PitchRunnerGame } from "./src/Game";
import { config } from "./src/config";

const game: GameModule = {
  slug: config.slug,
  title: config.title,
  tagline: config.tagline,
  archetype: "reaction",
  version: "0.1.0",
  defaultEnabled: false,
  component: PitchRunnerGame,
};
export default game;
