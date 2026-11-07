import type { ComponentType } from "react";
import type { Analytics } from "./analytics";
import type { InvitePayload } from "./deeplink";

export type Archetype = "guess_phrase" | "impostor" | "reverse_words" | "reaction" | "vote";

export interface GameProps {
  /** Present when the game was opened from a challenge link. */
  invite: InvitePayload | null;
  analytics: Analytics;
  onExit: () => void;
}

/** What every folder under games/ exports as default. The arcade shell only knows this shape. */
export interface GameModule {
  slug: string;
  title: string;
  tagline: string;
  archetype: Archetype;
  version: string;
  /** ISO region codes; empty or undefined means everywhere. */
  regions?: string[];
  /** Games ship behind a flag so a merge does not expose them before the team flips it. */
  defaultEnabled: boolean;
  component: ComponentType<GameProps>;
}
