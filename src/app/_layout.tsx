import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/services/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isHydrating, hydrate } = useAuth();

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!isHydrating) {
      SplashScreen.hideAsync()
    }
  }, [isHydrating])

  if (isHydrating) {
    return null
  };

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

const RootNavigator = () => {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <StatusBar barStyle={"dark-content"} />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}  >
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}  >
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
    </>
  )
}