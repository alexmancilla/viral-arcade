import type { AppBrief } from "@viral/devin-client";

export const archetypes = ["guess_phrase", "impostor", "reverse_words", "reaction", "vote"] as const;
export type ArchetypeName = (typeof archetypes)[number];

const defaults: Record<ArchetypeName, Partial<AppBrief>> = {
  guess_phrase: { rules: ["10 rounds, 15 s each", "Phrase is shown transformed; type the original", "Score by speed; a wrong guess reveals two letters"], kit_modules: ["timer", "rounds", "scoring", "haptics", "share-card", "deep-link"], success_metric: { metric: "invite_open_rate", target: 0.1, window_days: 7 } },
  reverse_words: { rules: ["10 rounds, 15 s each", "Phrase is shown with words reversed", "Score by speed"], kit_modules: ["timer", "rounds", "scoring", "haptics", "share-card", "deep-link"], success_metric: { metric: "invite_open_rate", target: 0.1, window_days: 7 } },
  impostor: { rules: ["3-10 players pass one phone", "Everyone sees the same word except the impostor", "60 s discussion, then vote"], kit_modules: ["timer", "haptics", "share-card"], success_metric: { metric: "d1_retention", target: 0.25, window_days: 7 }, screens: ["home", "reveal", "discuss", "vote", "result"] },
  reaction: { rules: ["Tap exactly when the cue fires", "5 attempts, best average wins"], kit_modules: ["timer", "scoring", "haptics", "share-card", "deep-link"], success_metric: { metric: "share_rate", target: 0.12, window_days: 7 } },
  vote: { rules: ["Two options per round", "See what everyone else picked after voting"], kit_modules: ["rounds", "share-card", "deep-link"], success_metric: { metric: "share_rate", target: 0.12, window_days: 7 } },
};

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "game";
}

/** Fills an AppBrief from a trend and archetype defaults. The LLM brief generator replaces the text fields in Phase 1. */
export function draftBrief(input: { briefId: string; trendTitle: string; mechanic: string; sources: string[]; score: number; archetype: ArchetypeName; title: string }): AppBrief {
  const d = defaults[input.archetype];
  return {
    brief_id: input.briefId,
    trend: { title: input.trendTitle, source_examples: input.sources.slice(0, 3), score: input.score, mechanic: input.mechanic || input.trendTitle },
    archetype: input.archetype,
    slug: slugify(input.title),
    title: input.title.slice(0, 30),
    pitch: `${input.title}: ${input.mechanic || "a game from this week's trend"}`.slice(0, 140),
    rules: d.rules ?? ["Describe the rules"],
    screens: d.screens ?? ["home", "round", "result", "share_card"],
    content_spec: {},
    share_mechanic: "native share sheet: result card + challenge deep link",
    success_metric: d.success_metric ?? { metric: "share_rate", target: 0.1, window_days: 7 },
    distribution: "container",
    platforms: ["ios", "android"],
    kit_modules: d.kit_modules ?? [],
    constraints: ["no copyrighted audio", "no platform logos", "iOS 16+, Android 9+"],
    acu_budget: 20,
  };
}

/** Statuses a reviewer may set by hand; dispatch-related statuses are only set by the system. */
export const REVIEW_STATUSES = ["draft", "in_review", "rejected"];
