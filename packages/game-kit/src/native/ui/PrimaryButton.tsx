import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "./theme";

export function PrimaryButton({ label, onPress, variant = "accent", disabled }: { label: string; onPress: () => void; variant?: "accent" | "ghost"; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.base, variant === "ghost" ? styles.ghost : styles.accent, pressed && { opacity: 0.8 }, disabled && { opacity: 0.4 }]}
    >
      <Text style={[styles.label, variant === "ghost" && { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: theme.radius, alignItems: "center", marginTop: 12 },
  accent: { backgroundColor: theme.accent },
  ghost: { backgroundColor: theme.card },
  label: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
