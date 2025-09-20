/**
 * Wallet feature type definitions
 */

export interface WalletState {
  address: string | null;
  balance: Balance[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface Balance {
  token: string;
  symbol: string;
  amount: string;
  decimals: number;
  usdValue?: number;
}

export interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap';
  amount: string;
  token: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  to?: string;
  from?: string;
}

export interface WalletConfig {
  network: 'mainnet' | 'testnet';
  rpcUrl: string;
}

export interface Token {
  address: string;
  image: string;
  name: string;
  tokenPrice: string;
  symbol: string;
  tokenBalance: string;
  balanceValue: string;
}