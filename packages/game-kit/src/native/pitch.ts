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

export { hzToMidi, midiToNoteName, centsOff } from "../core/pitch";

export type MicPermission = "unknown" | "granted" | "denied";

async function requestMic(): Promise<MicPermission> {
  // iOS: the system prompt appears when capture starts; we learn the answer from start() failing or the first sample arriving.
  if (Platform.OS !== "android") return "unknown";
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
      if (perm === "denied") return;
      pitchy.init({ bufferSize: opts.bufferSize ?? 4096 });
      sub = pitchy.addListener((e) => {
        // Silence or an unsure estimate clears the sample so games never act on a stale note.
        setPermission("granted");
        if (e.pitch > 0 && e.confidence >= (opts.minConfidence ?? 0.8)) setSample({ hz: e.pitch, confidence: e.confidence, volume: e.volume });
        else setSample(null);
      });
      pitchy.start().catch(() => {
        // A failed start only means "denied" when permission was never granted (iOS prompt refused);
        // on Android the grant is known, so a failure is an audio-route problem, not a permission one.
        setSample(null);
        setPermission((p) => (p === "granted" ? p : "denied"));
      });
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
