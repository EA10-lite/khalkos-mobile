/**
 * History feature type definitions
 */

export interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'deploy';
  amount: string;
  token: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  to?: string;
  from?: string;
  blockNumber?: number;
  gasUsed?: string;
  actualFee?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}
