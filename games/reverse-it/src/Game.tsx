import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  haptics, hintFor, initialRounds, isMatch, PrimaryButton, ResultCard, roundsReducer, Screen, seededShuffle,
  shareChallenge, speedScore, sum, theme, TimerBar, useCountdown, type GameProps,
} from "@viral/game-kit";
import { config } from "./config";
import phrases from "../content/phrases.json";

type Stage = "home" | "round" | "result";

export function GuessPhraseGame({ invite, analytics, onExit }: GameProps) {
  const [stage, setStage] = useState<Stage>("home");
  const [seed] = useState(() => invite?.s ?? Math.floor(Math.random() * 1e9));
  const deck = useMemo(() => seededShuffle(phrases as string[], seed).slice(0, config.rounds), [seed]);
  const [rounds, dispatch] = useReducer(roundsReducer, initialRounds(config.rounds));
  const [guess, setGuess] = useState("");
  const [hints, setHints] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const answer = deck[rounds.index] ?? "";

  const finishRound = useCallback((points: number) => {
    dispatch({ type: "score", points });
    setGuess("");
    setHints(0);
  }, []);

  const timer = useCountdown(config.roundMs, () => {
    haptics.error();
    finishRound(0);
  });

  useEffect(() => {
    if (invite) analytics.track({ name: "invite_opened", game: config.slug, fromScore: invite.sc });
  }, [invite, analytics]);

  useEffect(() => {
    if (rounds.phase === "between") {
      const id = setTimeout(() => {
        dispatch({ type: "next" });
      }, 900);
      return () => clearTimeout(id);
    }
    if (rounds.phase === "playing") timer.start();
    if (rounds.phase === "done") {
      timer.stop();
      analytics.track({ name: "game_end", game: config.slug, score: sum(rounds.scores), rounds: rounds.total, durationMs: Date.now() - startedAt });
      setStage("result");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds.phase, rounds.index]);

  const start = () => {
    analytics.track({ name: "game_start", game: config.slug, invite: !!invite });
    setStartedAt(Date.now());
    dispatch({ type: "start" });
    setStage("round");
  };

  const submit = () => {
    if (!guess.trim()) return;
    if (isMatch(guess, answer)) {
      haptics.success();
      timer.stop();
      finishRound(Math.max(0, speedScore(timer.remainingMs, config.roundMs) - hints * 100));
    } else {
      haptics.tap();
      setHints((h) => Math.min(config.maxHints, h + 1));
      setGuess("");
    }
  };

  const total = sum(rounds.scores);
  const maxScore = config.rounds * 1000;

  const share = async () => {
    analytics.track({ name: "share_click", game: config.slug, channel: "native" });
    await shareChallenge({ title: config.title, message: `I scored ${total} in ${config.title}. Beat me:`, invite: { g: config.slug, s: seed, sc: total } });
  };

  if (stage === "home") {
    return (
      <Screen title={config.title} onBack={onExit}>
        <Text style={styles.big}>{config.tagline}</Text>
        {invite?.sc != null ? <Text style={styles.muted}>Challenge: beat {invite.sc}</Text> : null}
        <Text style={styles.muted}>{config.rounds} rounds, {config.roundMs / 1000}s each.</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Play" onPress={start} />
      </Screen>
    );
  }

  if (stage === "result") {
    return (
      <Screen title={config.title} onBack={onExit}>
        <ResultCard title="Your score" score={total} maxScore={maxScore} beat={invite?.sc} />
        <View style={{ flex: 1 }} />
        <PrimaryButton label="Challenge a friend" onPress={share} />
        <PrimaryButton label="Play again" variant="ghost" onPress={() => { dispatch({ type: "reset" }); setStage("home"); }} />
      </Screen>
    );
  }

  return (
    <Screen title={`${rounds.index + 1} / ${rounds.total}`} onBack={() => { analytics.track({ name: "game_exit", game: config.slug, atRound: rounds.index }); onExit(); }}>
      <TimerBar remainingMs={timer.remainingMs} totalMs={config.roundMs} />
      <Text style={styles.prompt}>{config.prompt}</Text>
      <Text style={styles.big} testID="shown-phrase">{config.transform(answer)}</Text>
      {hints > 0 ? <Text style={styles.hint}>{hintFor(answer, hints * 2)}</Text> : null}
      <TextInput
        testID="guess-input"
        style={styles.input}
        value={guess}
        onChangeText={setGuess}
        onSubmitEditing={submit}
        placeholder="Type your guess"
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        autoFocus
      />
      <PrimaryButton label="Guess" onPress={submit} disabled={rounds.phase !== "playing"} />
      {rounds.phase === "between" ? <Text style={styles.good}>Correct: {answer}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { color: theme.text, fontSize: 28, fontWeight: "700", marginTop: 20, textAlign: "center" },
  prompt: { color: theme.muted, fontSize: 14, marginTop: 16, textAlign: "center" },
  hint: { color: theme.accent, fontSize: 20, letterSpacing: 2, textAlign: "center", marginTop: 8 },
  muted: { color: theme.muted, fontSize: 15, marginTop: 10, textAlign: "center" },
  good: { color: theme.good, fontSize: 16, marginTop: 12, textAlign: "center" },
  input: { backgroundColor: theme.card, color: theme.text, borderRadius: 12, padding: 14, fontSize: 18, marginTop: 20 },
});
