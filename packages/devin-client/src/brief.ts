import { z } from "zod";

/** The contract between the hub and Devin. Validate before a session is ever created. */
export const AppBriefSchema = z.object({
  brief_id: z.string().min(1),
  trend: z.object({
    title: z.string().min(1),
    source_examples: z.array(z.string().url()).default([]),
    score: z.number().min(0).max(1).optional(),
    mechanic: z.string().min(1),
  }),
  archetype: z.enum(["guess_phrase", "impostor", "reverse_words", "reaction", "vote"]),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case slug"),
  title: z.string().min(1).max(30),
  pitch: z.string().min(1).max(140),
  rules: z.array(z.string()).min(1),
  screens: z.array(z.string()).default(["home", "round", "result", "share_card"]),
  content_spec: z.record(z.unknown()).default({}),
  share_mechanic: z.string().default("native share sheet: result card + challenge deep link"),
  success_metric: z.object({ metric: z.string(), target: z.number(), window_days: z.number().int().positive() }),
  distribution: z.enum(["container", "standalone"]).default("container"),
  platforms: z.array(z.enum(["ios", "android"])).default(["ios", "android"]),
  kit_modules: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default(["no copyrighted audio", "no platform logos"]),
  acu_budget: z.number().int().positive().max(100).default(20),
  parent_game: z.string().optional(),
});

export type AppBrief = z.infer<typeof AppBriefSchema>;

/** What a build session must return. Mirrors BuildJob.structured_output in the hub. */
export const BuildOutputSchema = z.object({
  status: z.enum(["pr_opened", "blocked", "failed"]),
  slug: z.string(),
  pr_url: z.string().url().optional(),
  preview_channel: z.string().optional(),
  verified_on: z.array(z.enum(["android_emulator", "ios_simulator"])).optional(),
  blockers: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type BuildOutput = z.infer<typeof BuildOutputSchema>;

/** JSON Schema (draft 7) sent to the Devin API as structured_output_schema. Keep in sync with BuildOutputSchema. */
export const buildOutputJsonSchema = {
  type: "object",
  required: ["status", "slug"],
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["pr_opened", "blocked", "failed"] },
    slug: { type: "string" },
    pr_url: { type: "string" },
    preview_channel: { type: "string" },
    verified_on: { type: "array", items: { type: "string", enum: ["android_emulator", "ios_simulator"] } },
    blockers: { type: "array", items: { type: "string" } },
    notes: { type: "string" },
  },
} as const;
