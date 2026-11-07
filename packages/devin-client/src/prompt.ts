import type { AppBrief } from "./brief";

export interface PromptOptions {
  /** Skill/playbook reference the session should follow, e.g. "@skills:build-viral-game" (Skills) or a playbook macro. */
  playbookName?: string;
  /** Extra instructions appended by the reviewer who approved the brief. */
  reviewerNotes?: string;
}

/** The prompt is short on purpose: the procedure lives in the playbook, the spec lives in the brief. */
export function buildPrompt(brief: AppBrief, opts: PromptOptions = {}): string {
  const lines = [
    `Build the mobile game "${brief.title}" (slug: ${brief.slug}) in this Expo monorepo from the AppBrief below.`,
    `Follow ${opts.playbookName ?? "@skills:build-viral-game"} exactly: branch from develop, copy templates/${brief.archetype} to games/${brief.slug}, implement the mechanic with @viral/game-kit, register it in apps/arcade/src/registry.ts, verify it on the Android emulator, open a PR into develop, and return structured output.`,
    brief.parent_game ? `This is an iteration of games/${brief.parent_game}; modify that game instead of creating a new one.` : null,
    opts.reviewerNotes ? `Reviewer notes: ${opts.reviewerNotes}` : null,
    "",
    "<brief>",
    JSON.stringify(brief, null, 2),
    "</brief>",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function sessionTitle(brief: AppBrief): string {
  return `${brief.parent_game ? "Iterate" : "Build"} game: ${brief.slug} (${brief.brief_id})`;
}

export function sessionTags(brief: AppBrief): string[] {
  return ["viral-game", `brief:${brief.brief_id}`, `archetype:${brief.archetype}`, `distribution:${brief.distribution}`];
}
