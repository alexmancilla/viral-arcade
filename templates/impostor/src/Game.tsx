import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { haptics, PrimaryButton, Screen, seededShuffle, theme, TimerBar, useCountdown, type GameProps } from "@viral/game-kit";
import { config } from "./config";
import pairs from "../content/pairs.json";

type Stage = "home" | "reveal" | "discuss" | "vote" | "result";

/** Pass-the-phone party game: everyone sees the same word except one impostor; the group votes. */
export function ImpostorGame({ invite, analytics, onExit }: GameProps) {
  const [stage, setStage] = useState<Stage>("home");
  const [players, setPlayers] = useState(config.defaultPlayers);
  const [seed, setSeed] = useState(() => invite?.s ?? Math.floor(Math.random() * 1e9));
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(false);
  const [vote, setVote] = useState<number | null>(null);

  const round = useMemo(() => {
    const [a, b] = seededShuffle(pairs as [string, string][], seed)[0] ?? ["", ""];
    const impostor = seed % players;
    return { word: a, impostorWord: b, impostor };
  }, [seed, players]);

  const timer = useCountdown(config.discussionSeconds * 1000, () => { haptics.error(); setStage("vote"); });

  const start = () => {
    analytics.track({ name: "game_start", game: config.slug, invite: !!invite });
    setCurrent(0); setShown(false); setVote(null); setStage("reveal");
  };
  const nextPlayer = () => {
    haptics.tap();
    if (current + 1 >= players) { setStage("discuss"); timer.start(); return; }
    setCurrent(current + 1); setShown(false);
  };
  const finish = (v: number) => {
    setVote(v);
    const caught = v === round.impostor;
    caught ? haptics.success() : haptics.error();
    analytics.track({ name: "game_end", game: config.slug, score: caught ? 1 : 0, rounds: 1, durationMs: 0 });
    setStage("result");
  };
  const again = () => { setSeed(Math.floor(Math.random() * 1e9)); setStage("home"); };

  if (stage === "home") return (
    <Screen title={config.title} onBack={onExit}>
      <Text style={styles.big}>{config.tagline}</Text>
      <Text style={styles.muted}>Players: {players}</Text>
      <View style={styles.row}>
        <PrimaryButton label="-" variant="ghost" onPress={() => setPlayers(Math.max(config.minPlayers, players - 1))} />
        <PrimaryButton label="+" variant="ghost" onPress={() => setPlayers(Math.min(config.maxPlayers, players + 1))} />
      </View>
      <View style={{ flex: 1 }} />
      <PrimaryButton label="Start" onPress={start} />
    </Screen>
  );

  if (stage === "reveal") return (
    <Screen title={`Player ${current + 1}`} onBack={onExit}>
      <Text style={styles.muted}>Pass the phone to player {current + 1}. Nobody else should look.</Text>
      {shown ? (
        <Text style={styles.big} testID="secret-word">{current === round.impostor ? round.impostorWord : round.word}</Text>
      ) : (
        <PrimaryButton label="Tap to reveal" onPress={() => setShown(true)} />
      )}
      <View style={{ flex: 1 }} />
      <PrimaryButton label={current + 1 >= players ? "Everyone has seen it" : "Hide and pass"} onPress={nextPlayer} disabled={!shown} />
    </Screen>
  );

  if (stage === "discuss") return (
    <Screen title="Discuss" onBack={onExit}>
      <TimerBar remainingMs={timer.remainingMs} totalMs={config.discussionSeconds * 1000} />
      <Text style={styles.big}>Describe your word without saying it. Find the impostor.</Text>
      <View style={{ flex: 1 }} />
      <PrimaryButton label="Vote now" onPress={() => { timer.stop(); setStage("vote"); }} />
    </Screen>
  );

  if (stage === "vote") return (
    <Screen title="Who is the impostor?" onBack={onExit}>
      {Array.from({ length: players }, (_, i) => (
        <PrimaryButton key={i} label={`Player ${i + 1}`} variant="ghost" onPress={() => finish(i)} />
      ))}
    </Screen>
  );

  const caught = vote === round.impostor;
  return (
    <Screen title="Result" onBack={onExit}>
      <Text style={[styles.big, { color: caught ? theme.good : theme.bad }]}>{caught ? "Impostor caught!" : "The impostor escaped"}</Text>
      <Text style={styles.muted}>Impostor: player {round.impostor + 1}. Word: {round.word}. Impostor's word: {round.impostorWord}.</Text>
      <View style={{ flex: 1 }} />
      <PrimaryButton label="Play again" onPress={again} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { color: theme.text, fontSize: 28, fontWeight: "700", marginTop: 20, textAlign: "center" },
  muted: { color: theme.muted, fontSize: 15, marginTop: 10, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "center", gap: 12 },
});
