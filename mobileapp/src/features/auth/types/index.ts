/**
 * Auth feature type definitions
 */

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  walletAddress?: string;
}

export interface PinState {
  isPinSet: boolean;
  isValidating: boolean;
  attempts: number;
  maxAttempts: number;
}

export interface GoogleAuthResponse {
  user: User;
  walletData: {
    address: string;
    privateKey: string;
  };
}
