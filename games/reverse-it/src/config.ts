import { reverseLetters } from "@viral/game-kit/core";

/** Everything a brief usually changes lives here. Keep Game.tsx generic. */
export const config = {
  slug: "reverse-it",
  title: "Reverse It",
  tagline: "Read the phrase backwards, type the original before the timer ends.",
  rounds: 10,
  roundMs: 15000,
  maxHints: 3,
  /** How the phrase is shown to the player. Swap for the mechanic in the brief. */
  transform: (phrase: string): string => reverseLetters(phrase),
  prompt: "What is the original phrase?",
};
