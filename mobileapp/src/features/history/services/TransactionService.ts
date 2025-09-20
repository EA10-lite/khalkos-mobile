/**
 * Transaction Service for fetching transaction history
 */

import { RpcProvider } from 'starknet';
import { Transaction } from '../types';

class TransactionService {
  private provider: RpcProvider;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC,
    });
  }

  // Fetch transaction history for a wallet address
  async getTransactionHistory(walletAddress: string, limit: number = 20): Promise<Transaction[]> {
    try {

      this.provider.getTransaction
      // Note: This is a basic implementation. For production, you'd want to use
      // a proper indexing service like Voyager API or build your own indexer
      
      // For now, we'll return mock data. In production, you would:
      // 1. Use Voyager API: https://api.voyager.online/beta/txns?to=${address}
      // 2. Use StarkScan API: https://api.starkscan.co/api/v0/transactions
      // 3. Build your own indexer using Starknet events
      
      console.log('Fetching transaction history for:', walletAddress);
      
      // Mock transaction data for demonstration
      const mockTransactions: Transaction[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          type: 'receive',
          amount: '1.5',
          token: 'ETH',
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: 'success',
          from: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          to: walletAddress,
          blockNumber: 123456,
          gasUsed: '21000',
          actualFee: '0.001'
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          type: 'send',
          amount: '100',
          token: 'USDC',
          timestamp: Date.now() - 7200000, // 2 hours ago
          status: 'success',
          from: walletAddress,
          to: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
          blockNumber: 123450,
          gasUsed: '25000',
          actualFee: '0.0015'
        },
        {
          hash: '0x5555666677778888999900001111222233334444555566667777888899990000',
          type: 'swap',
          amount: '0.5',
          token: 'ETH → STRK',
          timestamp: Date.now() - 86400000, // 1 day ago
          status: 'success',
          from: walletAddress,
          to: walletAddress,
          blockNumber: 123400,
          gasUsed: '45000',
          actualFee: '0.002'
        },
        {
          hash: '0x9999000011112222333344445555666677778888999900001111222233334444',
          type: 'deploy',
          amount: '0',
          token: 'Account',
          timestamp: Date.now() - 172800000, // 2 days ago
          status: 'success',
          from: walletAddress,
          to: walletAddress,
          blockNumber: 123350,
          gasUsed: '0',
          actualFee: '0'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockTransactions;
    } catch (error: any) {
      console.error('Failed to fetch transaction history:', error);
      throw new Error(`Failed to load transaction history: ${error.message}`);
    }
  }

  // Get Voyager explorer URL for a transaction
  getExplorerUrl(txHash: string): string {
    return `https://sepolia.voyager.online/tx/${txHash}`;
  }

  // Format transaction amount for display
  formatAmount(amount: string, token: string): string {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    
    if (num < 0.001) {
      return `< 0.001 ${token}`;
    }
    
    return `${num.toFixed(6).replace(/\.?0+$/, '')} ${token}`;
  }

  // Get transaction type color
  getTransactionTypeColor(type: string): string {
    switch (type) {
      case 'receive': return '#10B981'; // Green
      case 'send': return '#EF4444'; // Red
      case 'swap': return '#3B82F6'; // Blue
      case 'deploy': return '#8B5CF6'; // Purple
      default: return '#6B7280'; // Gray
    }
  }

  // Get transaction type icon
  getTransactionTypeIcon(type: string): string {
    switch (type) {
      case 'receive': return 'arrow-down-left';
      case 'send': return 'arrow-up-right';
      case 'swap': return 'swap-horizontal';
      case 'deploy': return 'rocket';
      default: return 'help-circle';
    }
  }
}

export default TransactionService;
