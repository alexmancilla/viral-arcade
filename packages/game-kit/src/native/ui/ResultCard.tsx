import { StyleSheet, Text, View } from "react-native";
import { rankFor } from "../../core/scoring";
import { theme } from "./theme";

const rankLabel = { legend: "Legend", pro: "Pro", ok: "Not bad", rookie: "Rookie" } as const;

export function ResultCard({ title, score, maxScore, beat }: { title: string; score: number; maxScore: number; beat?: number }) {
  const rank = rankFor(score, maxScore);
  return (
    <View style={styles.card} testID="result-card">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.rank}>{rankLabel[rank]}</Text>
      {beat != null ? (
        <Text style={[styles.beat, { color: score > beat ? theme.good : theme.bad }]}>
          {score > beat ? `You beat ${beat}` : `Challenger had ${beat}`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.card, borderRadius: theme.radius, padding: 24, alignItems: "center", gap: 6 },
  title: { color: theme.muted, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
  score: { color: theme.text, fontSize: 64, fontWeight: "800" },
  rank: { color: theme.accent, fontSize: 20, fontWeight: "600" },
  beat: { fontSize: 15, marginTop: 6 },
});
