/** Pure pitch math shared by voice games (no React Native imports so it is unit-testable). */
export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function midiToNoteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const m = Math.round(midi);
  return `${names[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}

/** Cents between a frequency and a target MIDI note, folded to the nearest octave when `anyOctave`. */
export function centsOff(hz: number, targetMidi: number, anyOctave = true): number {
  let diff = hzToMidi(hz) - targetMidi;
  if (anyOctave) diff = ((((diff + 6) % 12) + 12) % 12) - 6;
  return diff * 100;
}

