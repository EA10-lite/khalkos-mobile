/**
 * Settings feature type definitions
 */

export interface SettingsState {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  notifications: {
    push: boolean;
    email: boolean;
    transactions: boolean;
  };
  security: {
    biometric: boolean;
    autoLock: boolean;
    autoLockTimeout: number;
  };
}
