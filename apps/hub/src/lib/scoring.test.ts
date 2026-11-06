import { describe, expect, it } from "vitest";
import { scoreTrend, statusForScore } from "./scoring";

describe("scoreTrend", () => {
  const now = new Date("2026-01-10T00:00:00Z");
  it("prefers fast growth over big old numbers", () => {
    const fresh = scoreTrend([{ views: 200_000, postedAt: new Date("2026-01-09T20:00:00Z"), platform: "tiktok" }], now);
    const old = scoreTrend([{ views: 5_000_000, postedAt: new Date("2025-12-01T00:00:00Z"), platform: "tiktok" }], now);
    expect(fresh.score).toBeGreaterThan(old.score);
  });
  it("adds a cross-platform bonus", () => {
    const one = scoreTrend([{ views: 100_000, postedAt: new Date("2026-01-09T12:00:00Z"), platform: "tiktok" }], now);
    const two = scoreTrend([
      { views: 50_000, postedAt: new Date("2026-01-09T12:00:00Z"), platform: "tiktok" },
      { views: 50_000, postedAt: new Date("2026-01-09T12:00:00Z"), platform: "youtube" },
    ], now);
    expect(two.score).toBeGreaterThan(one.score);
    expect(two.platforms).toEqual(["tiktok", "youtube"]);
  });
  it("does not demote a briefed trend", () => {
    expect(statusForScore(0.1, "briefed")).toBe("briefed");
    expect(statusForScore(0.7, "watching")).toBe("candidate");
  });
});
