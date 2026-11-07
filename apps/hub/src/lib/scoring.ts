export interface ScoreInput {
  views: number;
  postedAt: Date;
  platform: string;
}

/**
 * v0 scorer: growth, not size.
 * velocity = views per hour since posting (capped at 14 days); score squashes log-velocity to 0..1
 * and adds a bonus for every extra platform the trend appears on.
 */
export function scoreTrend(items: ScoreInput[], now = new Date()): { score: number; velocity: number; platforms: string[] } {
  if (items.length === 0) return { score: 0, velocity: 0, platforms: [] };
  let velocity = 0;
  const platforms = new Set<string>();
  for (const it of items) {
    const hours = Math.max(1, Math.min(24 * 14, (now.getTime() - it.postedAt.getTime()) / 36e5));
    velocity += it.views / hours;
    platforms.add(it.platform);
  }
  const base = Math.min(1, Math.log10(1 + velocity) / 6); // 1M views/hour saturates
  const bonus = Math.min(0.2, (platforms.size - 1) * 0.1);
  return { score: Math.round(Math.min(1, base + bonus) * 100) / 100, velocity: Math.round(velocity), platforms: [...platforms].sort() };
}

export function statusForScore(score: number, current: string): string {
  if (["briefed", "building", "live", "retired"].includes(current)) return current;
  return score >= 0.5 ? "candidate" : "watching";
}
