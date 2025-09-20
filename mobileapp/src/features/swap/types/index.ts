/**
 * Swap feature type definitions
 */

export interface SwapFormData {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: number;
}

export interface SwapState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  exchangeRate: number | null;
}
