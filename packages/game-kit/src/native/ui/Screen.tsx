import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "./theme";

export function Screen({ title, onBack, children }: PropsWithChildren<{ title?: string; onBack?: () => void }>) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
        {title ? <Text style={styles.title}>{title}</Text> : <View />}
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, paddingTop: 56, paddingHorizontal: theme.space },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44 },
  back: { color: theme.text, fontSize: 32, lineHeight: 32 },
  title: { color: theme.text, fontSize: 18, fontWeight: "600" },
  body: { flex: 1, paddingVertical: theme.space },
});
