import { hzToMidi } from "@viral/game-kit/core";
import type { PitchRunnerConfig } from "./config";

/** Pure run simulation (no React Native) so walls, holes and collisions are unit-testable with synthetic pitch. */

export interface Wall {
  index: number;
  /** Leading edge, metres. */
  x: number;
  /** Target pitch class (0 = C ... 11 = B); there is a hole at this note in every octave of the range. */
  pc: number;
}

export interface RunState {
  /** Distance travelled, metres. */
  x: number;
  /** Runner height as a (fractional) MIDI note, already smoothed. */
  midi: number;
  /** Centre of the view as a MIDI note; follows the runner to scroll smoothly. */
  cameraMidi: number;
  /** Walls fully passed. */
  passed: number;
  crashed: boolean;
  /** Wall hit, when crashed. */
  crashWall: number | null;
}

/** Deterministic PRNG (mulberry32) so a challenge seed reproduces the same walls. */
export function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random notes from the pool, never the same note twice in a row. */
export function noteSequence(seed: number, length: number, pool: readonly number[]): number[] {
  const next = rng(seed);
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const prev = out[i - 1];
    const choices = pool.length > 1 && prev !== undefined ? pool.filter((p) => p !== prev) : [...pool];
    out.push(choices[Math.floor(next() * choices.length)] as number);
  }
  return out;
}

export function buildWalls(seed: number, cfg: PitchRunnerConfig): Wall[] {
  return noteSequence(seed, cfg.sequenceLength, cfg.notePool).map((pc, index) => ({ index, pc, x: cfg.firstWallM + index * cfg.wallSpacingM }));
}

/** Hole centres (MIDI) for a pitch class: one per octave inside the singer range. */
export function holesFor(pc: number, minMidi: number, maxMidi: number): number[] {
  const out: number[] = [];
  const first = minMidi + ((((pc - minMidi) % 12) + 12) % 12);
  for (let m = first; m <= maxMidi; m += 12) out.push(m);
  return out;
}

export function clampMidi(midi: number, cfg: PitchRunnerConfig): number {
  return Math.min(cfg.maxMidi, Math.max(cfg.minMidi, midi));
}

/** True when a runner at `midi` fits through one of the wall's holes. */
export function fitsHole(midi: number, pc: number, cfg: PitchRunnerConfig): boolean {
  return holesFor(pc, cfg.minMidi, cfg.maxMidi).some((h) => Math.abs(midi - h) * 100 <= cfg.toleranceCents);
}

export function initialRun(cfg: PitchRunnerConfig): RunState {
  return { x: 0, midi: cfg.startMidi, cameraMidi: cfg.startMidi, passed: 0, crashed: false, crashWall: null };
}

const ease = (dtMs: number, tauMs: number) => (tauMs <= 0 ? 1 : 1 - Math.exp(-dtMs / tauMs));

/**
 * Advances the run by `dtMs`. `hz` is the sung frequency, or null for silence (the runner holds its height).
 * The runner is a point; it crashes if it is inside a wall's span and not inside one of its holes.
 */
export function step(state: RunState, dtMs: number, hz: number | null, walls: readonly Wall[], cfg: PitchRunnerConfig): RunState {
  if (state.crashed || dtMs <= 0) return state;
  const target = hz != null && hz > 0 ? clampMidi(hzToMidi(hz), cfg) : state.midi;
  const midi = state.midi + (target - state.midi) * ease(dtMs, cfg.pitchSmoothingMs);
  const cameraMidi = state.cameraMidi + (midi - state.cameraMidi) * ease(dtMs, cfg.scrollSmoothingMs);
  const x0 = state.x;
  const x = x0 + (cfg.speedMps * dtMs) / 1000;
  let passed = state.passed;
  for (let i = Math.max(0, passed - 1); i < walls.length; i++) {
    const w = walls[i] as Wall;
    if (w.x > x) break;
    const end = w.x + cfg.wallWidthM;
    // Any overlap of [x0, x] with the wall span during this frame is checked with the new height.
    if (x >= w.x && x0 <= end && !fitsHole(midi, w.pc, cfg)) {
      return { x: Math.max(x0, w.x), midi, cameraMidi, passed, crashed: true, crashWall: w.index };
    }
    if (end < x) passed = Math.max(passed, w.index + 1);
  }
  return { x, midi, cameraMidi, passed, crashed: false, crashWall: null };
}

/** Score shown to the player: whole metres travelled. */
export function distanceScore(state: RunState): number {
  return Math.floor(state.x);
}

/** Screen y (px from the top) of a MIDI note given the camera centre. */
export function midiToY(midi: number, cameraMidi: number, heightPx: number, cfg: PitchRunnerConfig): number {
  const pxPerSemitone = heightPx / cfg.visibleSemitones;
  return heightPx / 2 - (midi - cameraMidi) * pxPerSemitone;
}
