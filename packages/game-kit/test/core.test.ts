import { describe, expect, it } from "vitest";
import { speedScore, rankFor } from "../src/core/scoring";
import { isMatch, normalize, reverseLetters, reverseWords, hintFor, seededShuffle } from "../src/core/text";
import { initialRounds, roundsReducer } from "../src/core/rounds";
import { buildChallengeLink, decodeInvite, encodeInvite } from "../src/core/deeplink";
import { createAnalytics, memorySink } from "../src/core/analytics";

describe("scoring", () => {
  it("rewards speed and keeps a floor", () => {
    expect(speedScore(15000, 15000)).toBe(1000);
    expect(speedScore(0, 15000)).toBe(100);
    expect(speedScore(7500, 15000)).toBe(550);
  });
  it("ranks", () => {
    expect(rankFor(900, 1000)).toBe("legend");
    expect(rankFor(100, 1000)).toBe("rookie");
  });
});

describe("text", () => {
  it("normalizes accents and punctuation", () => {
    expect(normalize("  ¡Qué  onda, amigo! ")).toBe("que onda amigo");
  });
  it("reverses", () => {
    expect(reverseLetters("hola mundo")).toBe("odnum aloh");
    expect(reverseWords("say it backwards")).toBe("backwards it say");
  });
  it("forgives one typo on longer answers only", () => {
    expect(isMatch("break a lag", "break a leg")).toBe(true);
    expect(isMatch("cat", "car")).toBe(false);
    expect(isMatch("", "car")).toBe(false);
  });
  it("hints keep spaces", () => {
    expect(hintFor("no way", 2)).toBe("no ___");
  });
  it("seeded shuffle is deterministic", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6], 42);
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 42)).toEqual(a);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("rounds", () => {
  it("walks through phases", () => {
    let s = initialRounds(2);
    s = roundsReducer(s, { type: "start" });
    expect(s.phase).toBe("playing");
    s = roundsReducer(s, { type: "score", points: 500 });
    expect(s.phase).toBe("between");
    s = roundsReducer(s, { type: "next" });
    s = roundsReducer(s, { type: "score", points: 200 });
    expect(s.phase).toBe("done");
    expect(s.scores).toEqual([500, 200]);
  });
});

describe("deep links", () => {
  it("round-trips an invite", () => {
    const token = encodeInvite({ g: "reverse-it", s: 7, sc: 4200, n: "Ale" });
    expect(decodeInvite(token)).toEqual({ g: "reverse-it", s: 7, sc: 4200, n: "Ale" });
    expect(decodeInvite("garbage")).toBeNull();
  });
  it("builds an https challenge link", () => {
    const url = buildChallengeLink({ webHost: "arcade.example.com", scheme: "arcade" }, { g: "reverse-it", s: 1 });
    expect(url.startsWith("https://arcade.example.com/play/reverse-it?invite=")).toBe(true);
  });
});

describe("analytics", () => {
  it("fans out to sinks and survives a broken sink", () => {
    const buf: any[] = [];
    const a = createAnalytics([() => { throw new Error("boom"); }, memorySink(buf)]);
    a.track({ name: "game_start", game: "x", invite: false });
    expect(buf).toHaveLength(1);
    expect(buf[0].name).toBe("game_start");
  });
});
