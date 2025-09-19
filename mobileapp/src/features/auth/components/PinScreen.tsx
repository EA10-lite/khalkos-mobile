import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import SecureStorage from '../services/SecureStorage';

interface PinScreenProps {
  mode: 'setup' | 'verify';
  onSuccess: (pin?: string) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  showBiometric?: boolean;
}

const PinScreen: React.FC<PinScreenProps> = ({
  mode,
  onSuccess,
  onCancel,
  title,
  subtitle,
  showBiometric = true,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const maxAttempts = 5;

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const status = await SecureStorage.getBiometricStatus();
    setBiometricAvailable(
      status.isAvailable && status.isEnrolled && showBiometric,
    );
  };

  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      const success = await SecureStorage.authenticateUser(
        'Authenticate to access your wallet',
      );

      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showMessage({
          message: 'Authentication Failed',
          description: 'Please try again or use your PIN.',
          type: 'warning',
          duration: 3000,
        });
      }
    } catch (error) {
      showMessage({
        message: 'Error',
        description: 'Biometric authentication failed.',
        type: 'danger',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNumberPress = async (number: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mode === 'setup') {
      if (step === 'enter') {
        if (pin.length < 6) {
          setPin(pin + number);
        }
      } else {
        if (confirmPin.length < 6) {
          setConfirmPin(confirmPin + number);
        }
      }
    } else {
      if (pin.length < 6) {
        setPin(pin + number);
      }
    }
  };

  const handleBackspace = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mode === 'setup') {
      if (step === 'enter') {
        setPin(pin.slice(0, -1));
      } else {
        setConfirmPin(confirmPin.slice(0, -1));
      }
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const handlePinComplete = async () => {
    if (mode === 'setup') {
      if (step === 'enter' && pin.length === 6) {
        setStep('confirm');
        return;
      }

      if (step === 'confirm' && confirmPin.length === 6) {
        if (pin === confirmPin) {
          try {
            setLoading(true);
            await SecureStorage.storePin(pin);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            onSuccess(pin);
          } catch (error) {
            showMessage({
              message: 'Error',
              description: 'Failed to save PIN. Please try again.',
              type: 'danger',
              duration: 3000,
            });
          } finally {
            setLoading(false);
          }
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
          showMessage({
            message: 'PIN Mismatch',
            description: 'PINs do not match. Please try again.',
            type: 'warning',
            duration: 3000,
          });
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    } else {
      // Verify mode
      if (pin.length === 6) {
        try {
          setLoading(true);
          const isValid = await SecureStorage.verifyPin(pin);

          if (isValid) {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            onSuccess();
          } else {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
            Vibration.vibrate(500);

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= maxAttempts) {
              showMessage({
                message: 'Too Many Attempts',
                description: 'You have exceeded the maximum number of attempts. Please try again later.',
                type: 'danger',
                duration: 4000,
              });
              setTimeout(() => onCancel(), 2000);
            } else {
              showMessage({
                message: 'Incorrect PIN',
                description: `Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`,
                type: 'warning',
                duration: 3000,
              });
              setPin('');
            }
          }
        } catch (error) {
          showMessage({
            message: 'Error',
            description: 'Failed to verify PIN. Please try again.',
            type: 'danger',
            duration: 3000,
          });
          setPin('');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    const currentPin = mode === 'setup' && step === 'confirm' ? confirmPin : pin;
    if (currentPin.length === 6) {
      handlePinComplete();
    }
  }, [pin, confirmPin]);

  const renderPinDots = () => {
    const currentPin = mode === 'setup' && step === 'confirm' ? confirmPin : pin;
    return (
      <View className="flex-row justify-center mb-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={index}
            className={`w-4 h-4 rounded-full mx-2 ${
              index < currentPin.length ? 'bg-black' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace'],
    ];

    return (
      <View className="w-full max-w-sm">
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-4">
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} className="w-16 h-16" />;
              }

              if (item === 'backspace') {
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    onPress={handleBackspace}
                    className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center"
                    disabled={loading}
                  >
                    <Ionicons name="backspace-outline" size={24} color="#333" />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={() => handleNumberPress(item)}
                  className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center"
                  disabled={loading}
                >
                  <Text className="text-xl font-semibold text-black">
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const getTitle = () => {
    if (title) return title;
    if (mode === 'setup') {
      return step === 'enter' ? 'Set up your PIN' : 'Confirm your PIN';
    }
    return 'Enter your PIN';
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    if (mode === 'setup') {
      return step === 'enter'
        ? 'Choose a 6-digit PIN to secure your wallet'
        : 'Enter your PIN again to confirm';
    }
    return 'Enter your 6-digit PIN to continue';
  };

  return (
    <View className="flex-1 bg-white px-6 py-8">
      {/* Header */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-black mb-2">{getTitle()}</Text>
        <Text className="text-base text-gray-600 text-center">
          {getSubtitle()}
        </Text>
      </View>

      {/* PIN Dots */}
      {renderPinDots()}

      {/* Biometric Button */}
      {biometricAvailable && mode === 'verify' && (
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={handleBiometricAuth}
            className="w-16 h-16 rounded-full bg-black items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="finger-print" size={32} color="white" />
            )}
          </TouchableOpacity>
          <Text className="text-sm text-gray-600 mt-2">
            Use Face ID / Touch ID
          </Text>
        </View>
      )}

      {/* Number Pad */}
      <View className="flex-1 items-center justify-center">
        {renderNumberPad()}
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        onPress={onCancel}
        className="items-center py-4"
        disabled={loading}
      >
        <Text className="text-gray-600 text-base">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PinScreen;
