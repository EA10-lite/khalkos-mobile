import { PinScreen } from '@/src/features/auth';
import { StarknetWalletManager } from '@/src/features/wallet';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WalletUnlock = () => {
  const insets = useSafeAreaInsets();
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const walletManager = StarknetWalletManager.getInstance();

  useEffect(() => {
    loadWalletInfo();
  }, []);

  const loadWalletInfo = async () => {
    try {
      const info = walletManager.getWalletInfo();
      setWalletInfo(info);
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    }
  };

  const handleUnlockSuccess = async () => {
    try {
      // Authenticate and unlock the wallet
      await walletManager.authenticateAndUnlock();
      
      // Navigate to home
      router.replace('/(main)/(tabs)/home' as any);
    } catch (error: any) {
      showMessage({
        message: 'Unlock Failed',
        description: error.message || 'Failed to unlock wallet. Please try again.',
        type: 'danger',
        duration: 3000,
      });
    }
  };

  const handleCancel = () => {
    showMessage({
      message: 'Authentication Required',
      description: 'You need to unlock your wallet to continue.',
      type: 'warning',
      duration: 3000,
    });
  };

  return (
    <View 
      className="flex-1"
      style={{ paddingTop: insets.top }}
    >
      {/* Wallet Info Header */}
      {walletInfo && (
        <View className="px-6 py-4 bg-gray-50">
          <Text className="text-sm text-gray-600 text-center">
            Welcome back, {walletInfo.email}
          </Text>
          <Text className="text-xs text-gray-500 text-center mt-1">
            {StarknetWalletManager.formatAddress(walletInfo.address)}
          </Text>
        </View>
      )}

      <PinScreen
        mode="verify"
        onSuccess={handleUnlockSuccess}
        onCancel={handleCancel}
        title="Unlock Your Wallet"
        subtitle="Enter your PIN or use biometric authentication"
        showBiometric={true}
      />
    </View>
  );
};

export default WalletUnlock;
