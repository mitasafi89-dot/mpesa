import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="pin" />
        <Stack.Screen name="home" />
        <Stack.Screen name="send" />
        <Stack.Screen name="pay" />
        <Stack.Screen name="withdraw" />
        <Stack.Screen name="airtime" />
        <Stack.Screen name="bundles" />
        <Stack.Screen name="request" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="statements" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
