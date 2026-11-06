import { reverseLetters } from "@viral/game-kit/core";

/** Everything a brief usually changes lives here. Keep Game.tsx generic. */
export const config = {
  slug: "__SLUG__",
  title: "__TITLE__",
  tagline: "__PITCH__",
  rounds: 10,
  roundMs: 15000,
  maxHints: 3,
  /** How the phrase is shown to the player. Swap for the mechanic in the brief. */
  transform: (phrase: string): string => reverseLetters(phrase),
  prompt: "What is the original phrase?",
};
