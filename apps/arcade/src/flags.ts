import { useSyncExternalStore } from "react";
import type { GameModule } from "@viral/game-kit/core";

/**
 * Feature flags per game. Remote overrides (from the Hub's /api/flags) win over the module's
 * defaultEnabled; without a Hub URL or when offline the local defaults apply.
 * Set EXPO_PUBLIC_HUB_URL (e.g. http://10.0.2.2:3000 for the Android emulator, or the deployed Hub).
 */
let overrides: Record<string, boolean> = {};
const listeners = new Set<() => void>();

export const hubUrl = (process.env.EXPO_PUBLIC_HUB_URL ?? "").replace(/\/$/, "");

export function isEnabled(game: GameModule, flags: Record<string, boolean> = overrides): boolean {
  return flags[game.slug] ?? game.defaultEnabled;
}

export async function refreshFlags(): Promise<void> {
  if (!hubUrl) return;
  try {
    const res = await fetch(`${hubUrl}/api/flags`, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) return;
    const json = (await res.json()) as Record<string, boolean>;
    overrides = json;
    listeners.forEach((l) => l());
  } catch {
    // offline: keep whatever we had
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Re-renders when remote flags arrive. */
export function useFlags(): Record<string, boolean> {
  return useSyncExternalStore(subscribe, () => overrides, () => overrides);
}
