import { Stack } from "expo-router";
import { useEffect } from "react";
import { useUserStore } from "../stores/useUserStore";
import { View, ActivityIndicator } from "react-native";
import { syncUnsyncedEntries } from "@/services/journalDatabase";

export default function Layout() {
  const { loadUserFromStorage, loading } = useUserStore();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      syncUnsyncedEntries();
    }, 30000);
  
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="journal-entry"
        options={{
          headerShown: false,
          presentation: "modal"
        }}
      />
    </Stack>
  );
}
