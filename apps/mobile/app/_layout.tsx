import { Stack } from "expo-router";
import { useEffect } from "react";
import { useUserStore } from "../stores/useUserStore";
import { View, ActivityIndicator } from "react-native";
import { syncUnsyncedEntries } from "@/services/journalDatabase";
import notificationService from "../services/notificationService";
import { errorLogger } from "../services/errorLogger";

export default function Layout() {
  const { loadUserFromStorage, loading, currentUser } = useUserStore();

  useEffect(() => {
    // Initialize error logging
    errorLogger.setupGlobalErrorCapture();
    loadUserFromStorage();
  }, []);

  // Initialize notifications when user is loaded
  useEffect(() => {
    if (!loading && currentUser) {
      notificationService.initializeNotifications(currentUser.id);
    }
  }, [loading, currentUser]);

  useEffect(() => {
    if (!loading && currentUser) {
      syncUnsyncedEntries();
      const interval = setInterval(() => {
        syncUnsyncedEntries();
      }, 30000);
    
      return () => clearInterval(interval);
    }
  }, [loading, currentUser]);

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
