import { StyleSheet, View } from "react-native";
import { theme } from "./theme";

export function TimerBar({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const color = ratio > 0.5 ? theme.good : ratio > 0.2 ? theme.accent : theme.bad;
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(ratio * 100), min: 0, max: 100 }}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: theme.card, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
});
