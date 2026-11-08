/** Everything a brief usually changes lives here. Keep Game.tsx and logic.ts generic. */
export const config = {
  slug: "pitch-runner",
  title: "Pitch Runner",
  tagline: "Sing the right note to fly through the hole in each wall; one crash ends the run, how far can you get?",
  /** Singer range, absolute pitch (MIDI). C2 = 36, C6 = 84. */
  minMidi: 36,
  maxMidi: 84,
  /** Where the runner starts before the first note is heard (C4). */
  startMidi: 60,
  /** Semitones visible on screen at once (about one octave plus a margin). */
  visibleSemitones: 14,
  /** A hole is passed when the sung pitch is within this many cents of the target note (any octave). */
  toleranceCents: 60,
  /** World is measured in metres; the score is the distance travelled. */
  speedMps: 2.4,
  /** Metres of world visible across the screen width. */
  visibleMeters: 9,
  /** Runner's horizontal position as a fraction of the screen width. */
  runnerXRatio: 0.25,
  /** First wall position, so the player has time to find a note. */
  firstWallM: 9,
  /** Distance between the leading edges of consecutive walls. */
  wallSpacingM: 7.5,
  /** Walls are wide: the note must be held for wallWidthM / speedMps seconds. */
  wallWidthM: 1.6,
  /** Smoothing time constants (ms) for the runner following the voice and the view scrolling after the runner. */
  pitchSmoothingMs: 70,
  scrollSmoothingMs: 260,
  /** Detector confidence below which a frame counts as silence (the runner holds its height). */
  minConfidence: 0.8,
  /** How many walls a seed generates; long enough that nobody runs out. */
  sequenceLength: 400,
  /** Notes the walls ask for (pitch classes, 0 = C). Natural notes keep it singable. */
  notePool: [0, 2, 4, 5, 7, 9, 11],
};

export type PitchRunnerConfig = typeof config;
