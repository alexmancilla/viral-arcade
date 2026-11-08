import { describe, expect, it } from "vitest";
import { config } from "../src/config";
import { buildWalls, distanceScore, fitsHole, holesFor, initialRun, midiToY, noteSequence, step, type RunState, type Wall } from "../src/logic";

const hzOf = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const cents = (midi: number, c: number) => hzOf(midi + c / 100);

/** Runs the simulation at 60 fps with a pitch function of distance until crash or `maxM`. */
function simulate(walls: Wall[], pitchAt: (x: number, wallAhead: Wall | undefined) => number | null, maxM = 200): RunState {
  let s = initialRun(config);
  while (!s.crashed && s.x < maxM) s = step(s, 1000 / 60, pitchAt(s.x, walls[s.passed]), walls, config);
  return s;
}

describe("note sequence", () => {
  it("is deterministic per seed and never repeats a note twice in a row", () => {
    const a = noteSequence(42, 500, config.notePool);
    expect(noteSequence(42, 500, config.notePool)).toEqual(a);
    expect(noteSequence(43, 500, config.notePool)).not.toEqual(a);
    for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
    expect(new Set(a)).toEqual(new Set(config.notePool));
  });

  it("places walls at fixed spacing from the first wall", () => {
    const walls = buildWalls(7, config);
    expect(walls).toHaveLength(config.sequenceLength);
    expect(walls[0]!.x).toBe(config.firstWallM);
    expect(walls[3]!.x - walls[2]!.x).toBe(config.wallSpacingM);
  });
});

describe("holes", () => {
  it("has a hole at the target note in every octave of C2-C6", () => {
    expect(holesFor(0, 36, 84)).toEqual([36, 48, 60, 72, 84]);
    expect(holesFor(11, 36, 84)).toEqual([47, 59, 71, 83]);
    expect(holesFor(9, 36, 84)).toEqual([45, 57, 69, 81]);
  });

  it("accepts any octave within the tolerance and rejects outside it", () => {
    for (const m of [36, 48, 60, 72, 84]) expect(fitsHole(m, 0, config)).toBe(true);
    expect(fitsHole(60 + 0.59, 0, config)).toBe(true);
    expect(fitsHole(60 - 0.59, 0, config)).toBe(true);
    expect(fitsHole(60 + 0.61, 0, config)).toBe(false);
    expect(fitsHole(62, 0, config)).toBe(false);
  });
});

describe("run simulation with synthetic pitch", () => {
  const walls = buildWalls(1234, config);

  it("flies through many walls when singing each target note (switching octaves too)", () => {
    // Sing the next wall's note, alternating octave 3 and 4, slightly sharp (+40 cents).
    const s = simulate(walls, (_x, w) => (w ? cents(48 + w.pc + (w.index % 2) * 12, 40) : null), 200);
    expect(s.crashed).toBe(false);
    expect(s.passed).toBeGreaterThan(20);
    expect(distanceScore(s)).toBe(200);
  });

  it("crashes at the first wall when singing a wrong note", () => {
    const wrong = (walls[0]!.pc + 1) % 12;
    const s = simulate(walls, () => hzOf(60 + wrong));
    expect(s.crashed).toBe(true);
    expect(s.crashWall).toBe(0);
    expect(s.x).toBeCloseTo(config.firstWallM, 1);
    expect(distanceScore(s)).toBe(Math.floor(config.firstWallM));
  });

  it("crashes when the singer drifts off the note inside a wide wall", () => {
    const w0 = walls[0]!;
    const s = simulate(walls, (x) => (x < w0.x + config.wallWidthM / 2 ? hzOf(60 + w0.pc) : hzOf(60 + w0.pc + 2)));
    expect(s.crashed).toBe(true);
    expect(s.crashWall).toBe(0);
    expect(s.x).toBeGreaterThan(w0.x);
  });

  it("holds height through silence so a held note survives detector dropouts", () => {
    const w0 = walls[0]!;
    // Sing the note before the wall, then go silent through it.
    const s = simulate(walls, (x) => (x < w0.x - 1 ? hzOf(60 + w0.pc) : null), w0.x + config.wallWidthM + 0.5);
    expect(s.crashed).toBe(false);
    expect(s.passed).toBe(1);
  });

  it("clamps pitch to the singer range", () => {
    let s = initialRun(config);
    for (let i = 0; i < 120; i++) s = step(s, 16, 30, [], config);
    expect(s.midi).toBeGreaterThanOrEqual(config.minMidi - 1e-9);
    expect(s.midi).toBeCloseTo(config.minMidi, 1);
  });

  it("does not tunnel through a wall on a long frame", () => {
    const s = step({ ...initialRun(config), x: config.firstWallM - 0.1 }, 5000, hzOf(61 + walls[0]!.pc), walls, config);
    expect(s.crashed).toBe(true);
    expect(s.crashWall).toBe(0);
  });

  it("scrolls the view smoothly: camera lags the runner then catches up", () => {
    let s = initialRun(config);
    s = step(s, 100, hzOf(72), [], config);
    expect(s.midi).toBeGreaterThan(s.cameraMidi);
    expect(s.cameraMidi).toBeGreaterThan(config.startMidi);
    for (let i = 0; i < 200; i++) s = step(s, 16, hzOf(72), [], config);
    expect(s.cameraMidi).toBeCloseTo(72, 1);
  });

  it("maps about one octave to the screen height around the camera", () => {
    expect(midiToY(60, 60, 700, config)).toBe(350);
    expect(midiToY(60 + config.visibleSemitones / 2, 60, 700, config)).toBeCloseTo(0);
    expect(midiToY(72, 60, 700, config)).toBeLessThan(midiToY(60, 60, 700, config));
  });
});
