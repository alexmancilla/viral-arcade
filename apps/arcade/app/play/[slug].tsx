import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { decodeInvite } from "@viral/game-kit/core";
import { theme } from "@viral/game-kit";
import { findGame } from "@/registry";
import { isEnabled, useFlags } from "@/flags";
import { analytics } from "@/analytics";

/** Deep link target: arcade://play/<slug>?invite=<token> and https://<host>/play/<slug>?invite=<token>. */
export default function Play() {
  const { slug, invite } = useLocalSearchParams<{ slug: string; invite?: string }>();
  const router = useRouter();
  const flags = useFlags();
  const game = findGame(slug);
  if (!game || !isEnabled(game, flags)) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>This game is not available here yet.</Text>
      </View>
    );
  }
  const Game = game.component;
  const payload = decodeInvite(invite);
  return <Game invite={payload && payload.g === game.slug ? payload : null} analytics={analytics} onExit={() => (router.canGoBack() ? router.back() : router.replace("/"))} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg },
  text: { color: theme.muted },
});
