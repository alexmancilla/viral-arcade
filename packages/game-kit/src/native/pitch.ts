import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

/**
 * Real-time voice pitch from the microphone (react-native-pitchy, a native module shipped in the
 * arcade binary since 1.1.0). In Expo Go or an older binary the module is missing: `available`
 * is false and `hz` stays null, so games can show a "needs the latest Arcade" message instead of crashing.
 */
export interface PitchSample {
  hz: number;
  confidence: number;
  volume: number;
}

type PitchyModule = {
  init(config?: { bufferSize?: number; minVolume?: number }): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(cb: (e: { pitch: number; confidence: number; volume: number }) => void): { remove(): void };
};

function loadPitchy(): PitchyModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-pitchy");
    return (mod.default ?? mod) as PitchyModule;
  } catch {
    return null;
  }
}

export const pitchAvailable = loadPitchy() !== null;

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

export type MicPermission = "unknown" | "granted" | "denied";

async function requestMic(): Promise<MicPermission> {
  if (Platform.OS !== "android") return "granted"; // iOS prompts on first capture using NSMicrophoneUsageDescription
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return r === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
}

export function usePitch(opts: { active: boolean; minConfidence?: number; bufferSize?: number }): {
  sample: PitchSample | null;
  available: boolean;
  permission: MicPermission;
} {
  const [sample, setSample] = useState<PitchSample | null>(null);
  const [permission, setPermission] = useState<MicPermission>("unknown");
  const mod = useRef<PitchyModule | null>(null);
  useEffect(() => {
    if (!opts.active) return;
    const pitchy = (mod.current ??= loadPitchy());
    if (!pitchy) return;
    let cancelled = false;
    let sub: { remove(): void } | null = null;
    requestMic().then((perm) => {
      if (cancelled) return;
      setPermission(perm);
      if (perm !== "granted") return;
      pitchy.init({ bufferSize: opts.bufferSize ?? 4096 });
      sub = pitchy.addListener((e) => {
        // Silence or an unsure estimate clears the sample so games never act on a stale note.
        if (e.pitch > 0 && e.confidence >= (opts.minConfidence ?? 0.8)) setSample({ hz: e.pitch, confidence: e.confidence, volume: e.volume });
        else setSample(null);
      });
      pitchy.start().catch(() => setSample(null));
    });
    return () => {
      cancelled = true;
      sub?.remove();
      pitchy.stop().catch(() => undefined);
      setSample(null);
    };
  }, [opts.active, opts.bufferSize, opts.minConfidence]);
  return { sample, available: mod.current !== null || pitchAvailable, permission };
}
