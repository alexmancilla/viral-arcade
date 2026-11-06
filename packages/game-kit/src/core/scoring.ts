/** Points for a correct answer: faster is better, never below a floor so a late correct answer still counts. */
export function speedScore(remainingMs: number, totalMs: number, max = 1000, floor = 100): number {
  if (totalMs <= 0) return floor;
  const ratio = Math.min(1, Math.max(0, remainingMs / totalMs));
  return Math.round(floor + (max - floor) * ratio);
}

export function sum(scores: readonly number[]): number {
  return scores.reduce((a, b) => a + b, 0);
}

/** Simple rank label for a result card. */
export function rankFor(total: number, maxPossible: number): "legend" | "pro" | "ok" | "rookie" {
  if (maxPossible <= 0) return "rookie";
  const r = total / maxPossible;
  if (r >= 0.85) return "legend";
  if (r >= 0.6) return "pro";
  if (r >= 0.3) return "ok";
  return "rookie";
}
