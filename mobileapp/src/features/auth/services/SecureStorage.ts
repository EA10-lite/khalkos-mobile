import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { WalletData } from '../../wallet/services/StarknetWalletManager';

export interface StoredWalletData extends WalletData {
  createdAt: number;
  lastAccessedAt: number;
}

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

class SecureStorage {
  private static readonly WALLET_KEY = 'khalkos_starknet_wallet_data';
  private static readonly PIN_KEY = 'khalkos_user_pin';
  private static readonly SETTINGS_KEY = 'khalkos_security_settings';

  // Check biometric availability
  static async getBiometricStatus(): Promise<BiometricStatus> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        isAvailable,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  // Authenticate with biometrics or PIN
  static async authenticateUser(
    reason: string = 'Access your wallet',
  ): Promise<boolean> {
    try {
      const biometricStatus = await this.getBiometricStatus();

      if (biometricStatus.isAvailable && biometricStatus.isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
          requireConfirmation: false,
        });

        return result.success;
      }

      // If biometrics not available, we'll handle PIN authentication in the UI
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Store wallet data securely
  static async storeWallet(walletData: WalletData): Promise<void> {
    try {
      const dataToStore: StoredWalletData = {
        ...walletData,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      await SecureStore.setItemAsync(
        this.WALLET_KEY,
        JSON.stringify(dataToStore),
        {
          requireAuthentication: false, // Temporarily disabled for development
          authenticationPrompt: 'Authenticate to save your wallet',
        },
      );
    } catch (error: any) {
      throw new Error(`Failed to store wallet: ${error.message}`);
    }
  }

  // Get stored wallet data with authentication
  static async getStoredWallet(
    requireAuth: boolean = true,
  ): Promise<StoredWalletData | null> {
    try {
      console.log("testing")
      const options = requireAuth
        ? {
            requireAuthentication: true,
            authenticationPrompt: 'Authenticate to access your wallet',
          }
        : {};

      const storedData = await SecureStore.getItemAsync(
        this.WALLET_KEY,
        options,
      );

      console.log("storedData", storedData);

      if (storedData) {
        const walletData = JSON.parse(storedData) as StoredWalletData;

        // Update last accessed time
        walletData.lastAccessedAt = Date.now();
        await SecureStore.setItemAsync(
          this.WALLET_KEY,
          JSON.stringify(walletData),
          options,
        );

        return walletData;
      }

      return null;
    } catch (error) {
      console.warn('Failed to retrieve wallet:', error);
      return null;
    }
  }

  // Store user PIN
  static async storePin(pin: string): Promise<void> {
    try {
      // Hash the PIN before storing
      const hashedPin = await this.hashPin(pin);
      await SecureStore.setItemAsync(this.PIN_KEY, hashedPin);
    } catch (error: any) {
      throw new Error(`Failed to store PIN: ${error.message}`);
    }
  }

  // Verify user PIN
  static async verifyPin(pin: string): Promise<boolean> {
    try {
      const storedHashedPin = await SecureStore.getItemAsync(this.PIN_KEY);
      if (!storedHashedPin) return false;

      const hashedPin = await this.hashPin(pin);
      return hashedPin === storedHashedPin;
    } catch (error) {
      console.error('PIN verification error:', error);
      return false;
    }
  }

  // Check if PIN exists
  static async hasPinSet(): Promise<boolean> {
    try {
      const pin = await SecureStore.getItemAsync(this.PIN_KEY);
      return pin !== null;
    } catch (error) {
      return false;
    }
  }

  // Clear all stored data
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(this.WALLET_KEY),
        SecureStore.deleteItemAsync(this.PIN_KEY),
        SecureStore.deleteItemAsync(this.SETTINGS_KEY),
      ]);
    } catch (error) {
      console.warn('Failed to clear all data:', error);
    }
  }

  // Store security settings
  static async storeSecuritySettings(settings: {
    biometricEnabled: boolean;
    pinEnabled: boolean;
  }): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        this.SETTINGS_KEY,
        JSON.stringify(settings),
      );
    } catch (error: any) {
      throw new Error(`Failed to store security settings: ${error.message}`);
    }
  }

  // Get security settings
  static async getSecuritySettings(): Promise<{
    biometricEnabled: boolean;
    pinEnabled: boolean;
  }> {
    try {
      const settings = await SecureStore.getItemAsync(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
      return { biometricEnabled: true, pinEnabled: true };
    } catch (error) {
      return { biometricEnabled: true, pinEnabled: true };
    }
  }

  // Private method to hash PIN
  private static async hashPin(pin: string): Promise<string> {
    // Simple hash for PIN using a basic algorithm
    // In production, consider using a proper cryptographic library
    const saltedPin = pin + 'khalkos_salt';
    let hash = 0;
    for (let i = 0; i < saltedPin.length; i++) {
      const char = saltedPin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export default SecureStorage;
