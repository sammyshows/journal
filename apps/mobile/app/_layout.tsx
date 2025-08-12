import { Stack } from "expo-router";
import { useEffect } from "react";
import { useUserStore } from "../stores/useUserStore";

export default function RootLayout() {
  const { loadUserFromStorage } = useUserStore();

  useEffect(() => {
    // Initialize user data when app starts
    loadUserFromStorage();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="journal-entry" 
        options={{ 
          headerShown: false,
          presentation: 'modal' 
        }} 
      />
    </Stack>
  );
}
