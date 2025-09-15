import Logo from "@/assets/images/logo.svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  
  useEffect(() => {
    const bootstrap = () => {
      setTimeout(async () => {
      const isFirstTime = await AsyncStorage.getItem("isOnboarded");
        if (!isFirstTime) {
          router.replace("/onboarding");
        } 
        else {
        }
      }, 2000);
    };


    bootstrap();
  }, []); 
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Logo />
    </View>
  );
}
