import { PinScreen, SecureStorage } from '@/src/features/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PinSetup = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'setup' | 'success'>('setup');

  const handlePinSetupSuccess = async (pin?: string) => {
    try {
      // Store security settings
      await SecureStorage.storeSecuritySettings({
        biometricEnabled: true,
        pinEnabled: true,
      });

      setStep('success');
      
      // Navigate to home after a short delay
      setTimeout(() => {
        router.replace('/(main)/(tabs)/home' as any);
      }, 2000);
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Failed to complete setup. Please try again.',
        type: 'danger',
        duration: 3000,
      });
    }
  };

  const handleCancel = () => {
    showMessage({
      message: 'Setup Required',
      description: 'You need to set up a PIN to secure your wallet.',
      type: 'warning',
      duration: 3000,
    });
  };

  if (step === 'success') {
    return (
      <View 
        className="flex-1 bg-white items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
          <Text className="text-3xl">✓</Text>
        </View>
        <Text className="text-2xl font-bold text-black text-center mb-4">
          Setup Complete!
        </Text>
        <Text className="text-base text-gray-600 text-center">
          Your wallet is now secure and ready to use.
        </Text>
      </View>
    );
  }

  return (
    <View 
      className="flex-1"
      style={{ paddingTop: insets.top }}
    >
      <PinScreen
        mode="setup"
        onSuccess={handlePinSetupSuccess}
        onCancel={handleCancel}
        title="Secure Your Wallet"
        subtitle="Set up a 6-digit PIN to protect your wallet"
        showBiometric={false}
      />
    </View>
  );
};

export default PinSetup;
