import Logo from "@/assets/images/logo.svg";
import SecureStorage from "@/src/services/security/SecureStorage";
import StarknetWalletManager from "@/src/services/wallet/StarknetWalletManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Add a small delay to ensure app is fully loaded
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const walletManager = StarknetWalletManager.getInstance();
        
        // Check if wallet exists
        const walletExists = await walletManager.initialize();
        
        if (walletExists) {
          // Check if PIN is set up
          const hasPinSet = await SecureStorage.hasPinSet();
          
          if (hasPinSet) {
            // Wallet exists and PIN is set - redirect to unlock screen
            router.replace('/wallet-unlock' as any);
          } else {
            // Wallet exists but no PIN - redirect to PIN setup
            router.replace('/pin-setup' as any);
          }
        } else {
          // No wallet exists - check if first time
          const isFirstTime = await AsyncStorage.getItem("isOnboarded");
          if (!isFirstTime) {
            router.replace("/onboarding");
          } else {
            // User has been onboarded but no wallet - go to onboarding again
            router.replace("/onboarding");
          }
        }
      } catch (error) {
        console.error('Bootstrap error:', error);
        // On error, go to onboarding
        router.replace("/onboarding");
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
