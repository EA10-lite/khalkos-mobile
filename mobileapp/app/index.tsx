import Logo from "@/assets/images/logo.svg";
import { useAuth } from "@/src/features/auth/providers/auth";
import StarknetWalletManager from "@/src/features/wallet/services/StarknetWalletManager";
import SecureStorage from "@/src/services/security/SecureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {

  const { isLoading, user} = useAuth();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const walletManager = StarknetWalletManager.getInstance();
        const walletExists = await walletManager.initialize();

        if(isLoading){
          return null
        }
        
        if (walletExists && user) {
          // Check if PIN is set up
          const hasPinSet = await SecureStorage.hasPinSet();
          
          if (hasPinSet) {
            // Wallet exists and PIN is set - redirect to unlock screen
            router.replace('/(auth)/wallet-unlock' as any);
          } else {
            // Wallet exists but no PIN - redirect to PIN setup
            router.replace('/(auth)/pin-setup' as any);
          }
        } else {
          const isFirstTime = await AsyncStorage.getItem("isOnboarded");
          if (!isFirstTime) {
            router.replace("/(onboarding)/onboarding" as any);
          } else {
            router.replace("/(onboarding)/onboarding" as any);
          }
        }
      } catch (error) {
        console.error('Bootstrap error:', error);
        router.replace("/(onboarding)/onboarding" as any);
      }
    };

    bootstrap();
  }, []); 
  
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Logo />
    </View>
  );
}
