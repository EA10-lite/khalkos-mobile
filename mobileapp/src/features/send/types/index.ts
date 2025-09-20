/**
 * Send feature type definitions
 */

export interface SendFormData {
  recipientAddress: string;
  amount: string;
  selectedToken: string;
  memo?: string;
}

export interface SendState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
