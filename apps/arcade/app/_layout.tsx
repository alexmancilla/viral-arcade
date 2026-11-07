import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { refreshFlags } from "@/flags";

export default function RootLayout() {
  useEffect(() => {
    refreshFlags();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshFlags();
    });
    return () => sub.remove();
  }, []);
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0E0F14" } }} />
    </>
  );
}
