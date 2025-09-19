/**
 * PIN management hook
 * Business logic for PIN setup and validation
 */
import { useState } from 'react';
import SecureStorage from '../services/SecureStorage';
import type { PinState } from '../types';

export function usePin() {
  const [pinState, setPinState] = useState<PinState>({
    isPinSet: false,
    isValidating: false,
    attempts: 0,
    maxAttempts: 5,
  });

  const checkPinStatus = async () => {
    try {
      const isPinSet = await SecureStorage.hasPinSet();
      setPinState(prev => ({ ...prev, isPinSet }));
      return isPinSet;
    } catch (error) {
      console.error('Error checking PIN status:', error);
      return false;
    }
  };

  const setupPin = async (pin: string): Promise<boolean> => {
    try {
      setPinState(prev => ({ ...prev, isValidating: true }));
      
      await SecureStorage.storePin(pin);
      
      setPinState(prev => ({
        ...prev,
        isPinSet: true,
        isValidating: false,
        attempts: 0,
      }));
      
      return true;
    } catch (error) {
      setPinState(prev => ({ ...prev, isValidating: false }));
      throw error;
    }
  };

  const validatePin = async (pin: string): Promise<boolean> => {
    try {
      setPinState(prev => ({ ...prev, isValidating: true }));
      
      const isValid = await SecureStorage.verifyPin(pin);
      
      if (isValid) {
        setPinState(prev => ({
          ...prev,
          isValidating: false,
          attempts: 0,
        }));
        return true;
      } else {
        setPinState(prev => ({
          ...prev,
          isValidating: false,
          attempts: prev.attempts + 1,
        }));
        return false;
      }
    } catch (error) {
      setPinState(prev => ({
        ...prev,
        isValidating: false,
        attempts: prev.attempts + 1,
      }));
      throw error;
    }
  };

  const resetPin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      setPinState(prev => ({ ...prev, isValidating: true }));
      
      // Validate old PIN first
      const isOldPinValid = await SecureStorage.verifyPin(oldPin);
      if (!isOldPinValid) {
        setPinState(prev => ({ ...prev, isValidating: false }));
        throw new Error('Current PIN is incorrect');
      }
      
      // Set new PIN
      await SecureStorage.storePin(newPin);
      
      setPinState(prev => ({
        ...prev,
        isValidating: false,
        attempts: 0,
      }));
      
      return true;
    } catch (error) {
      setPinState(prev => ({ ...prev, isValidating: false }));
      throw error;
    }
  };

  const isMaxAttemptsReached = () => {
    return pinState.attempts >= pinState.maxAttempts;
  };

  const getRemainingAttempts = () => {
    return Math.max(0, pinState.maxAttempts - pinState.attempts);
  };

  return {
    ...pinState,
    checkPinStatus,
    setupPin,
    validatePin,
    resetPin,
    isMaxAttemptsReached,
    getRemainingAttempts,
  };
}
