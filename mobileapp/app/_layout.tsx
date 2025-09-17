import AppInitializer from "@/src/components/AppInitializer";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import FlashMessage from "react-native-flash-message";
import "../global.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    bold: require("../assets/fonts/DMSans-Bold.ttf"),
    medium: require("../assets/fonts/DMSans-Medium.ttf"),
    regular: require("../assets/fonts/DMSans-Regular.ttf"),
    semibold: require("../assets/fonts/DMSans-SemiBold.ttf"),
  });

  if(!fontsLoaded) {
    return(
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size={"large"}/>
      </View>
    )
  }

  return (
    <AppInitializer>
      <StatusBar style="dark" backgroundColor="white" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="get-started" />
        <Stack.Screen name="pin-setup" />
        <Stack.Screen name="wallet-unlock" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <FlashMessage position="top" />
    </AppInitializer>
  );
}
