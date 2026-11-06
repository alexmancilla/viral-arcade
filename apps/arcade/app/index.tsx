import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@viral/game-kit";
import { games } from "@/registry";
import { isEnabled, useFlags } from "@/flags";

export default function Home() {
  const flags = useFlags();
  const visible = games.filter((g) => isEnabled(g, flags));
  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Arcade</Text>
      <Text style={styles.sub}>Games born from what is trending this week.</Text>
      <FlatList
        data={visible}
        keyExtractor={(g) => g.slug}
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/play/[slug]", params: { slug: item.slug } }} asChild>
            <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} testID={`game-${item.slug}`}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.tagline}>{item.tagline}</Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={styles.sub}>No games enabled yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, paddingTop: 72, paddingHorizontal: 16 },
  h1: { color: theme.text, fontSize: 36, fontWeight: "800" },
  sub: { color: theme.muted, fontSize: 15, marginTop: 6 },
  card: { backgroundColor: theme.card, borderRadius: theme.radius, padding: 20 },
  title: { color: theme.text, fontSize: 20, fontWeight: "700" },
  tagline: { color: theme.muted, fontSize: 14, marginTop: 4 },
});
