import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { haptics, midiToNoteName, PrimaryButton, ResultCard, Screen, shareChallenge, theme, usePitch, type GameProps } from "@viral/game-kit";
import { config } from "./config";
import { buildWalls, distanceScore, holesFor, initialRun, midiToY, step, type RunState, type Wall } from "./logic";
import content from "../content/notes.json";

type Stage = "home" | "round" | "result" | "share_card";
const t = content.strings.en;
const noteName = (pc: number) => content.names.en[pc] ?? "?";

/** Best distance for this app session. The kit has no persistent storage module yet (see PR notes). */
let sessionBest = 0;

export function PitchRunnerGame({ invite, analytics, onExit }: GameProps) {
  const [stage, setStage] = useState<Stage>("home");
  const [seed, setSeed] = useState(() => invite?.s ?? Math.floor(Math.random() * 1e9));
  const walls = useMemo(() => buildWalls(seed, config), [seed]);
  const [best, setBest] = useState(sessionBest);
  const [last, setLast] = useState<{ distance: number; walls: number; newBest: boolean } | null>(null);
  const [micAttempt, setMicAttempt] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (invite) analytics.track({ name: "invite_opened", game: config.slug, fromScore: invite.sc });
  }, [invite, analytics]);

  const start = () => {
    analytics.track({ name: "game_start", game: config.slug, invite: !!invite });
    startedAt.current = Date.now();
    setStage("round");
  };

  const onCrash = useCallback(
    (run: RunState) => {
      haptics.error();
      const distance = distanceScore(run);
      const newBest = distance > sessionBest;
      if (newBest) sessionBest = distance;
      setBest(sessionBest);
      setLast({ distance, walls: run.passed, newBest });
      analytics.track({ name: "game_end", game: config.slug, score: distance, rounds: run.passed, durationMs: Date.now() - startedAt.current });
      setStage("result");
    },
    [analytics],
  );

  const share = async () => {
    analytics.track({ name: "share_click", game: config.slug, channel: "native" });
    await shareChallenge({ title: config.title, message: t.shareMessage.replace("{d}", String(best)), invite: { g: config.slug, s: seed, sc: best } });
  };

  const exitRound = (atWall: number) => {
    analytics.track({ name: "game_exit", game: config.slug, atRound: atWall });
    onExit();
  };

  if (stage === "home") {
    return (
      <Screen title={config.title} onBack={onExit}>
        <Text style={styles.big}>{config.tagline}</Text>
        <Text style={styles.muted}>{t.howTo}</Text>
        <Text style={styles.muted}>{t.noLives}</Text>
        {invite?.sc != null ? <Text style={styles.accent}>Challenge: beat {invite.sc} m</Text> : null}
        {best > 0 ? <Text style={styles.accent} testID="best-distance">{t.best}: {best} m</Text> : null}
        <View style={{ flex: 1 }} />
        <PrimaryButton label={t.play} onPress={start} />
      </Screen>
    );
  }

  if (stage === "result") {
    return (
      <Screen title={config.title} onBack={onExit}>
        <Text style={[styles.big, { color: theme.bad }]}>{t.crashed}</Text>
        <View style={{ height: 16 }} />
        <ResultCard title={`${t.distance} (m)`} score={last?.distance ?? 0} maxScore={Math.max(best, invite?.sc ?? 0, 1)} beat={invite?.sc} />
        <Text style={styles.muted}>{last?.walls ?? 0} {t.walls} · {t.best}: {best} m</Text>
        {last?.newBest ? <Text style={styles.good}>{t.newBest}</Text> : null}
        <View style={{ flex: 1 }} />
        <PrimaryButton label={t.shareCard} onPress={() => setStage("share_card")} />
        <PrimaryButton label={t.playAgain} variant="ghost" onPress={() => { startedAt.current = Date.now(); analytics.track({ name: "game_start", game: config.slug, invite: !!invite }); setStage("round"); }} />
      </Screen>
    );
  }

  if (stage === "share_card") {
    return (
      <Screen title={config.title} onBack={() => setStage("result")}>
        <View style={styles.card} testID="share-card">
          <Text style={styles.cardKicker}>{config.title}</Text>
          <Text style={styles.cardScore}>{best} m</Text>
          <Text style={styles.cardLine}>{t.best} · {last?.walls ?? 0} {t.walls}</Text>
          <View style={styles.cardNotes}>
            {walls.slice(0, 8).map((w) => (
              <Text key={w.index} style={styles.cardNote}>{noteName(w.pc)}</Text>
            ))}
          </View>
          <Text style={styles.cardLine}>Same walls for you. Can you go further?</Text>
        </View>
        <View style={{ flex: 1 }} />
        <PrimaryButton label={t.challenge} onPress={share} />
        <PrimaryButton label={t.playAgain} variant="ghost" onPress={() => { if (!invite) setSeed(Math.floor(Math.random() * 1e9)); setStage("home"); }} />
      </Screen>
    );
  }

  return (
    <Round
      key={micAttempt}
      walls={walls}
      onCrash={onCrash}
      onExit={exitRound}
      onRetryMic={() => setMicAttempt((n) => n + 1)}
    />
  );
}

function Round({ walls, onCrash, onExit, onRetryMic }: { walls: Wall[]; onCrash: (run: RunState) => void; onExit: (atWall: number) => void; onRetryMic: () => void }) {
  const { sample, available, permission, error } = usePitch({ active: true, minConfidence: config.minConfidence });
  const live = available && permission === "granted" && !error;
  const [run, setRun] = useState<RunState>(() => initialRun(config));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hzRef = useRef<number | null>(null);
  hzRef.current = sample?.hz ?? null;
  const runRef = useRef(run);
  const passedRef = useRef(0);
  const heardRef = useRef(false);
  if (sample) heardRef.current = true;

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    let prev = 0;
    const frame = (now: number) => {
      const dt = prev ? Math.min(50, now - prev) : 0;
      prev = now;
      // The run starts moving once the first note is heard, so nobody crashes while finding their voice.
      const next = heardRef.current ? step(runRef.current, dt, hzRef.current, walls, config) : runRef.current;
      runRef.current = next;
      setRun(next);
      if (next.passed > passedRef.current) {
        passedRef.current = next.passed;
        haptics.tap();
      }
      if (next.crashed) {
        onCrash(next);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [live, walls, onCrash]);

  const back = () => onExit(runRef.current.passed);

  if (!available) {
    return (
      <Screen title={config.title} onBack={back}>
        <Text style={styles.big}>Microphone</Text>
        <Text style={styles.muted} testID="needs-arcade">{t.needsArcade}</Text>
      </Screen>
    );
  }
  if (permission === "denied" || error) {
    return (
      <Screen title={config.title} onBack={back}>
        <Text style={styles.big}>Microphone</Text>
        <Text style={styles.muted} testID="mic-denied">{error ? t.micError : t.permissionDenied}</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton label={t.retry} onPress={onRetryMic} />
        <PrimaryButton label={t.openSettings} variant="ghost" onPress={() => Linking.openSettings().catch(() => undefined)} />
      </Screen>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const { w, h } = size;
  const pxPerM = w / config.visibleMeters;
  const runnerX = w * config.runnerXRatio;
  const toX = (m: number) => runnerX + (m - run.x) * pxPerM;
  const yOf = (midi: number) => midiToY(midi, run.cameraMidi, h, config);
  const holeHalfPx = ((config.toleranceCents / 100) * h) / config.visibleSemitones;
  const visibleWalls = walls.filter((wl) => toX(wl.x + config.wallWidthM) > 0 && toX(wl.x) < w);
  const lowMidi = Math.floor(run.cameraMidi - config.visibleSemitones / 2) - 1;
  const highMidi = Math.ceil(run.cameraMidi + config.visibleSemitones / 2) + 1;
  const nextWall = walls[run.passed];

  return (
    <Screen title={`${distanceScore(run)} m`} onBack={back}>
      <View style={styles.hud}>
        <Text style={styles.hudText} testID="next-note">Next: {nextWall ? noteName(nextWall.pc) : "-"}</Text>
        <Text style={styles.hudText} testID="sung-note">{sample ? midiToNoteName(Math.round(run.midi)) : permission === "granted" ? t.singToStart : t.waitingMic}</Text>
      </View>
      <View style={styles.field} onLayout={onLayout} testID="pitch-field">
        {h > 0
          ? Array.from({ length: highMidi - lowMidi + 1 }, (_, i) => lowMidi + i)
              .filter((m) => m >= config.minMidi && m <= config.maxMidi)
              .map((m) => (
                <View key={`g${m}`} style={[styles.gridLine, { top: yOf(m), opacity: m % 12 === 0 ? 0.5 : 0.15 }]}>
                  {m % 12 === 0 ? <Text style={styles.gridLabel}>{midiToNoteName(m)}</Text> : null}
                </View>
              ))
          : null}
        {h > 0 ? <View style={[styles.limit, { top: 0, height: Math.max(0, yOf(config.maxMidi + 0.5)) }]} /> : null}
        {h > 0 ? <View style={[styles.limit, { top: Math.min(h, yOf(config.minMidi - 0.5)), bottom: 0 }]} /> : null}
        {h > 0
          ? visibleWalls.map((wl) => {
              const left = toX(wl.x);
              const width = config.wallWidthM * pxPerM;
              const holes = holesFor(wl.pc, config.minMidi, config.maxMidi).map((m) => yOf(m)).sort((a, b) => a - b);
              const segs: Array<{ top: number; bottom: number }> = [];
              let cursor = -h;
              for (const y of holes) {
                segs.push({ top: cursor, bottom: y - holeHalfPx });
                cursor = y + holeHalfPx;
              }
              segs.push({ top: cursor, bottom: 2 * h });
              const crashedHere = run.crashWall === wl.index;
              return (
                <View key={wl.index} style={[StyleSheet.absoluteFill, { left, width }]} pointerEvents="none">
                  {segs
                    .filter((s) => s.bottom > 0 && s.top < h)
                    .map((s, i) => (
                      <View key={i} style={[styles.wall, crashedHere && { backgroundColor: theme.bad }, { top: Math.max(0, s.top), height: Math.min(h, s.bottom) - Math.max(0, s.top) }]} />
                    ))}
                  {holes
                    .filter((y) => y > 0 && y < h)
                    .map((y) => (
                      <Text key={`n${y}`} style={[styles.holeLabel, { top: y - 9, width }]}>{noteName(wl.pc)}</Text>
                    ))}
                </View>
              );
            })
          : null}
        {h > 0 ? <View testID="runner" style={[styles.runner, { left: runnerX - 11, top: yOf(run.midi) - 11, opacity: sample ? 1 : 0.6 }]} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { color: theme.text, fontSize: 26, fontWeight: "700", marginTop: 20, textAlign: "center" },
  muted: { color: theme.muted, fontSize: 15, marginTop: 12, textAlign: "center", lineHeight: 21 },
  accent: { color: theme.accent, fontSize: 17, fontWeight: "600", marginTop: 16, textAlign: "center" },
  good: { color: theme.good, fontSize: 17, fontWeight: "600", marginTop: 8, textAlign: "center" },
  hud: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  hudText: { color: theme.text, fontSize: 16, fontWeight: "600" },
  field: { flex: 1, backgroundColor: theme.card, borderRadius: theme.radius, overflow: "hidden" },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: theme.muted },
  gridLabel: { position: "absolute", left: 6, top: -16, color: theme.muted, fontSize: 11 },
  limit: { position: "absolute", left: 0, right: 0, backgroundColor: "#00000066" },
  wall: { position: "absolute", left: 0, right: 0, backgroundColor: theme.accent, borderRadius: 6 },
  holeLabel: { position: "absolute", left: 0, textAlign: "center", color: theme.text, fontSize: 14, fontWeight: "700" },
  runner: { position: "absolute", width: 22, height: 22, borderRadius: 11, backgroundColor: theme.good, borderWidth: 2, borderColor: "#fff" },
  card: { backgroundColor: theme.card, borderRadius: theme.radius, padding: 28, alignItems: "center", gap: 8, marginTop: 12, borderWidth: 2, borderColor: theme.accent },
  cardKicker: { color: theme.accent, fontSize: 14, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  cardScore: { color: theme.text, fontSize: 64, fontWeight: "800" },
  cardLine: { color: theme.muted, fontSize: 15, textAlign: "center" },
  cardNotes: { flexDirection: "row", gap: 8, marginVertical: 8, flexWrap: "wrap", justifyContent: "center" },
  cardNote: { color: theme.text, backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, fontSize: 15, fontWeight: "700" },
});
