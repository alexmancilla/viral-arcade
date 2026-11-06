export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function reverseLetters(s: string): string {
  return Array.from(s).reverse().join("");
}

export function reverseWords(s: string): string {
  return s.trim().split(/\s+/).reverse().join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[n] ?? 0;
}

/** Accepts small typos on longer answers so the game feels forgiving. */
export function isMatch(guess: string, answer: string): boolean {
  const g = normalize(guess);
  const a = normalize(answer);
  if (!g || !a) return false;
  if (g === a) return true;
  const tolerance = a.length >= 12 ? 2 : a.length >= 6 ? 1 : 0;
  return levenshtein(g, a) <= tolerance;
}

/** Reveal one more character of the answer as a hint; keeps spaces visible. */
export function hintFor(answer: string, revealed: number): string {
  return Array.from(answer)
    .map((ch, i) => (ch === " " ? " " : i < revealed ? ch : "_"))
    .join("");
}

/** Deterministic shuffle so a shared seed gives both players the same order. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}
