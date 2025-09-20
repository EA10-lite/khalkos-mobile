/**
 * Transaction Service for fetching transaction history
 */

import { Transaction } from '../types';

class TransactionService {
  private network: 'mainnet' | 'sepolia';
  
  constructor(network: 'mainnet' | 'sepolia' = 'sepolia') {
    this.network = network;
  }

  // Fetch transaction history for a wallet address
  async getTransactionHistory(walletAddress: string, limit: number = 20, page: number = 1): Promise<Transaction[]> {
    try {
      console.log('Fetching transaction history for:', walletAddress);
      
      const transactions = await this.getTransactions(walletAddress, page, limit);
      
      // Format transactions for our UI
      const formattedTransactions = transactions.map((tx: any) => this.formatTransactionData(tx));
      
      return formattedTransactions;
    } catch (error: any) {
      console.error('Failed to fetch transaction history:', error);
      // Fallback to empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Fetch enhanced transaction history with detailed data for each transaction
  async getEnhancedTransactionHistory(walletAddress: string, limit: number = 10, page: number = 1): Promise<Transaction[]> {
    try {
      console.log('Fetching enhanced transaction history for:', walletAddress);
      
      // First get the basic transaction list
      const transactions = await this.getTransactions(walletAddress, page, limit);
      
      // Then fetch detailed data for each transaction
      const enhancedTransactions = await Promise.allSettled(
        transactions.map(async (tx: any) => {
          try {
            const detailedTx = await this.getTransactionDetails(tx.hash);
            return this.formatTransactionData(detailedTx);
          } catch (error) {
            console.warn(`Failed to fetch details for transaction ${tx.hash}, using basic data:`, error);
            // Fallback to basic transaction data if detailed fetch fails
            return this.formatTransactionData(tx);
          }
        })
      );
      
      // Filter out failed requests and return successful ones
      return enhancedTransactions
        .filter((result): result is PromiseFulfilledResult<Transaction> => result.status === 'fulfilled')
        .map(result => result.value);
        
    } catch (error: any) {
      console.error('Failed to fetch enhanced transaction history:', error);
      // Fallback to basic transaction history
      return this.getTransactionHistory(walletAddress, limit, page);
    }
  }

  // Format and validate Starknet address
  private formatStarknetAddress(address: string): string {
    // Remove 0x prefix if present
    let cleanAddress = address.toLowerCase().replace('0x', '');
    
    // Pad with zeros to make it 64 characters (32 bytes)
    cleanAddress = cleanAddress.padStart(64, '0');
    
    // Add 0x prefix back
    return '0x' + cleanAddress;
  }

  // Get transactions using Voyager API
  async getTransactions(accountAddress: string, page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      // Format the address properly
      const formattedAddress = this.formatStarknetAddress(accountAddress);
      
      // Get base URL based on network
      const baseUrl = this.network === 'mainnet' ? 'https://sepolia.voyager.online' : 'https://sepolia.voyager.online';
      
      // Try different API endpoint formats - Voyager might use different parameters
      const urls = [
        `${baseUrl}/api/txns?to=${formattedAddress}&ps=${limit}&p=${page}`,
        `${baseUrl}/api/txns?to=${accountAddress}&ps=${limit}&p=${page}`,
        `${baseUrl}/api/txns?to=${formattedAddress}&ps=${limit}&p=${page}&type=null`,
        `${baseUrl}/api/txns/${formattedAddress}?ps=${limit}&p=${page}`,
      ];
      
      console.log('Trying to fetch transactions for address:', accountAddress);
      console.log('Formatted address:', formattedAddress);
      
      for (const url of urls) {
        try {
          console.log('Fetching from Voyager API:', url);
          
          const response = await fetch(url);
          console.log('Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            console.warn(`API request failed for ${url}: ${response.status} ${response.statusText}`);
            continue; // Try next URL
          }
          
          const data = await response.json();
          console.log('Response data:', JSON.stringify(data, null, 2));
          
          // Handle different response formats
          if (data.items && data.items.length > 0) {
            console.log(`Successfully fetched ${data.items.length} transactions from ${url}`);
            return data.items;
          } else if (Array.isArray(data) && data.length > 0) {
            console.log(`Successfully fetched ${data.length} transactions from ${url}`);
            return data;
          } else if (data.error) {
            console.error('API returned error:', data.error);
            continue; // Try next URL
          } else {
            console.warn('Empty or unexpected response format from', url, ':', data);
            continue; // Try next URL
          }
        } catch (error: any) {
          console.error(`Error fetching from ${url}:`, error);
          continue; // Try next URL
        }
      }
      
      // If all URLs failed, return empty array
      console.error('All API endpoints failed for address:', accountAddress);
      return [];
    } catch (error: any) {
      console.error('Error fetching transactions from Voyager:', error);
      return [];
    }
  }

  // Get detailed transaction information from Voyager API
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      // Get base URL based on network
      const baseUrl = this.network === 'mainnet' ? 'https://sepolia.voyager.online' : 'https://sepolia.voyager.online';
      
      // Use the correct Voyager API endpoint for transaction details with timestamp and refresh interval
      const timestamp = Date.now();
      const url = `${baseUrl}/api/txn/${txHash}?timestamp=${timestamp}&refreshInterval=3500`;
      console.log('Fetching transaction details from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction details: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  // Format raw transaction data from Voyager API for our UI
  formatTransactionData(tx: any): Transaction {
    // Handle both list view format and detailed format
    const isDetailedFormat = tx.header && tx.receipt;
    
    if (isDetailedFormat) {
      return this.formatDetailedTransactionData(tx);
    }
    
    // Legacy format for transaction list
    return {
      hash: tx.hash,
      type: this.determineTransactionType(tx),
      status: this.normalizeStatus(tx.execution_status),
      timestamp: tx.timestamp * 1000, // Convert to milliseconds
      from: tx.sender_address,
      to: this.extractRecipientFromCalldata(tx.calldata) || 'Contract Call',
      amount: this.parseAmountFromCalldata(tx.calldata),
      token: this.determineTokenFromOperations(tx.operations),
      gasUsed: this.formatFee(tx.actual_fee),
      blockNumber: tx.blockNumber,
      actualFee: this.formatFee(tx.actual_fee)
    };
  }

  // Format detailed transaction data from the detailed API endpoint
  private formatDetailedTransactionData(tx: any): Transaction {
    const header = tx.header;
    const receipt = tx.receipt;
    const transferData = this.parseTokenTransfers(receipt);
    
    return {
      hash: header.hash,
      type: this.determineTransactionTypeFromDetails(tx),
      status: this.normalizeStatus(header.execution_status),
      timestamp: header.timestamp * 1000, // Convert to milliseconds
      from: header.sender_address,
      to: transferData.to || header.contract_address || 'Contract Call',
      amount: transferData.amount,
      token: transferData.token,
      gasUsed: this.formatFee(tx.actualFee),
      blockNumber: header.blockNumber,
      actualFee: this.formatFee(tx.actualFee)
    };
  }

  // Parse amount from Voyager API calldata
  parseAmountFromCalldata(calldata: any): string {
    if (!calldata || !calldata.data || calldata.data.length < 10) return '0';
    
    try {
      // Voyager API returns calldata as Buffer with data array
      // Amount is typically in the calldata but position varies by operation
      // This is a simplified parser - you may need to adjust based on your contract structure
      
      const data = calldata.data;
      // Look for amount-like values (typically larger numbers in the calldata)
      for (let i = 0; i < data.length - 1; i++) {
        if (data[i] === 0 && data[i + 1] > 0) {
          try {
            const amount = BigInt(data[i + 1]);
            if (amount > 1000) { // Filter out small numbers that aren't amounts
              return (Number(amount) / 1e18).toFixed(6).replace(/\.?0+$/, '');
            }
          } catch (e) {
            continue;
          }
        }
      }
      return '0';
    } catch (error) {
      return '0';
    }
  }

  // Extract recipient address from calldata
  private extractRecipientFromCalldata(calldata: any): string | null {
    if (!calldata || !calldata.data) return null;
    
    try {
      const data = calldata.data;
      // Look for address-like patterns in calldata
      // This is simplified - you may need to adjust based on your contract structure
      
      for (let i = 0; i < data.length - 32; i++) {
        if (data[i] === 160) { // 160 often indicates an address follows
          const addressBytes = data.slice(i + 1, i + 33);
          if (addressBytes.length === 32) {
            const address = '0x' + addressBytes.map((b: number) => b.toString(16).padStart(2, '0')).join('');
            if (this.isValidAddress(address)) {
              return address;
            }
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Determine transaction type from Voyager data
  private determineTransactionType(tx: any): 'send' | 'receive' | 'swap' | 'deploy' {
    if (tx.type === 'DEPLOY_ACCOUNT') return 'deploy';
    
    const operations = tx.operations?.toLowerCase() || '';
    
    if (operations.includes('swap') || operations.includes('multi_route_swap')) return 'swap';
    if (operations.includes('transfer') || operations.includes('approve')) return 'send';
    if (operations.includes('deposit') || operations.includes('redeem')) return 'receive';
    
    return 'send'; // Default fallback
  }

  // Determine token from operations
  private determineTokenFromOperations(operations: string): string {
    if (!operations) return 'ETH';
    
    const ops = operations.toLowerCase();
    if (ops.includes('usdc')) return 'USDC';
    if (ops.includes('usdt')) return 'USDT';
    if (ops.includes('strk') || ops.includes('starknet')) return 'STRK';
    if (ops.includes('wbtc') || ops.includes('bitcoin')) return 'WBTC';
    
    return 'ETH'; // Default
  }

  // Normalize status from Voyager API
  private normalizeStatus(status: string): 'pending' | 'success' | 'failed' {
    if (!status) return 'pending';
    
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('succeed')) return 'success';
    if (normalizedStatus.includes('fail') || normalizedStatus.includes('reject') || normalizedStatus.includes('revert')) return 'failed';
    return 'pending';
  }

  // Validate if string looks like a valid address
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address) && address !== '0x' + '0'.repeat(64);
  }

  // Format fee for display
  private formatFee(fee: string | undefined): string {
    if (!fee || fee === '0') return '0';
    
    try {
      const feeAmount = BigInt(fee);
      const formattedFee = (Number(feeAmount) / 1e18).toFixed(6).replace(/\.?0+$/, '');
      return formattedFee;
    } catch (error) {
      return '0';
    }
  }

  // Get Voyager explorer URL for a transaction
  getExplorerUrl(txHash: string, network?: 'mainnet' | 'sepolia'): string {
    const targetNetwork = network || this.network;
    const baseUrl = targetNetwork === 'mainnet' ? 'https://sepolia.voyager.online' : 'https://sepolia.voyager.online';
    return `${baseUrl}/tx/${txHash}`;
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

  // Parse token transfers from detailed transaction receipt
  private parseTokenTransfers(receipt: any): { amount: string; token: string; to: string } {
    if (!receipt) return { amount: '0', token: 'ETH', to: '' };

    // Check tokensTransferred first (for regular token transfers)
    if (receipt.tokensTransferred && receipt.tokensTransferred.length > 0) {
      const transfer = receipt.tokensTransferred[0]; // Take the first/main transfer
      return {
        amount: transfer.amount || '0',
        token: transfer.symbol || 'ETH',
        to: transfer.to || ''
      };
    }

    // Check NFT transfers
    if (receipt.nftTransferred && receipt.nftTransferred.length > 0) {
      const nftTransfer = receipt.nftTransferred[0];
      return {
        amount: nftTransfer.quantity || '1',
        token: nftTransfer.collectionSymbol || 'NFT',
        to: nftTransfer.to || ''
      };
    }

    // Fallback to fee transfer if no other transfers found
    if (receipt.feeTransferred && receipt.feeTransferred.length > 0) {
      const feeTransfer = receipt.feeTransferred[0];
      return {
        amount: feeTransfer.amount || '0',
        token: feeTransfer.symbol || 'STRK',
        to: feeTransfer.to || ''
      };
    }

    return { amount: '0', token: 'ETH', to: '' };
  }

  // Determine transaction type from detailed transaction data
  private determineTransactionTypeFromDetails(tx: any): 'send' | 'receive' | 'swap' | 'deploy' {
    if (tx.header?.type === 'DEPLOY_ACCOUNT' || tx.header?.type === 'DEPLOY') return 'deploy';
    
    const receipt = tx.receipt;
    if (!receipt) return 'send';

    // Check events for more specific transaction types
    const events = receipt.events || [];
    const eventNames = events.map((e: any) => e.name?.toLowerCase() || '').join(' ');
    
    if (eventNames.includes('redeemrequested') || eventNames.includes('redeem')) return 'receive';
    if (eventNames.includes('swap') || eventNames.includes('exchange')) return 'swap';
    
    // Check if there are token transfers
    if (receipt.tokensTransferred && receipt.tokensTransferred.length > 0) {
      return 'send'; // Assume sending tokens
    }
    
    // Check NFT transfers
    if (receipt.nftTransferred && receipt.nftTransferred.length > 0) {
      const nftTransfer = receipt.nftTransferred[0];
      if (nftTransfer.type === 'Mint') return 'receive';
      return 'send';
    }

    return 'send'; // Default fallback
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

  // Get transaction summary from detailed transaction data
  getTransactionSummary(tx: any): { 
    totalTokensTransferred: number; 
    totalNftsTransferred: number; 
    totalEventsEmitted: number;
    gasEfficiency: string;
  } {
    if (!tx.receipt) {
      return { 
        totalTokensTransferred: 0, 
        totalNftsTransferred: 0, 
        totalEventsEmitted: 0,
        gasEfficiency: 'N/A'
      };
    }

    const receipt = tx.receipt;
    const tokensTransferred = receipt.tokensTransferred?.length || 0;
    const nftsTransferred = receipt.nftTransferred?.length || 0;
    const eventsEmitted = receipt.events?.length || 0;
    
    // Calculate gas efficiency (events per gas unit)
    const gasUsed = tx.l2GasConsumed || 0;
    const gasEfficiency = gasUsed > 0 ? (eventsEmitted / gasUsed * 1000000).toFixed(2) : 'N/A';

    return {
      totalTokensTransferred: tokensTransferred,
      totalNftsTransferred: nftsTransferred,
      totalEventsEmitted: eventsEmitted,
      gasEfficiency: gasEfficiency
    };
  }

  // Check if transaction involves specific token contract
  involvesToken(tx: any, tokenAddress: string): boolean {
    if (!tx.receipt) return false;
    
    const receipt = tx.receipt;
    
    // Check token transfers
    if (receipt.tokensTransferred) {
      return receipt.tokensTransferred.some((transfer: any) => 
        transfer.tokenAddress?.toLowerCase() === tokenAddress.toLowerCase()
      );
    }
    
    // Check events from token contract
    if (receipt.events) {
      return receipt.events.some((event: any) => 
        event.fromAddress?.toLowerCase() === tokenAddress.toLowerCase()
      );
    }
    
    return false;
  }
}

export default TransactionService;
