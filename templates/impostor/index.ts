import type { GameModule } from "@viral/game-kit/core";
import { ImpostorGame } from "./src/Game";
import { config } from "./src/config";

const game: GameModule = {
  slug: config.slug,
  title: config.title,
  tagline: config.tagline,
  archetype: "impostor",
  version: "0.1.0",
  defaultEnabled: false,
  component: ImpostorGame,
};
export default game;
