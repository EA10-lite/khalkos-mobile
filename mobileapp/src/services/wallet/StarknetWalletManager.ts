import { Account, CallData, RpcProvider } from 'starknet';
import GoogleAuthManager, { GoogleAuthResult } from '../auth/GoogleAuthManager';
import SecureStorage, { StoredWalletData } from '../security/SecureStorage';
import WalletGenerator, { WalletData } from './WalletGenerator';

export interface WalletManagerState {
  isInitialized: boolean;
  isLoggedIn: boolean;
  wallet: StoredWalletData | null;
  account: Account | null;
}

class StarknetWalletManager {
  private static instance: StarknetWalletManager;
  private provider: RpcProvider;
  private wallet: StoredWalletData | null = null;
  private account: Account | null = null;
  private googleAuth: GoogleAuthManager;

  private constructor() {
    this.provider = new RpcProvider({
      nodeUrl: 'https://starknet-sepolia.public.blastapi.io', // Use sepolia for testing
    });
    this.googleAuth = GoogleAuthManager.getInstance();
  }

  static getInstance(): StarknetWalletManager {
    if (!StarknetWalletManager.instance) {
      StarknetWalletManager.instance = new StarknetWalletManager();
    }
    return StarknetWalletManager.instance;
  }

  // Initialize the wallet manager
  async initialize(): Promise<StoredWalletData | null> {
    try {
      await this.googleAuth.configure();

      // Check if user has stored wallet (without requiring auth initially)
      const storedWallet = await SecureStorage.getStoredWallet(false);
      if (storedWallet && WalletGenerator.validateWalletData(storedWallet)) {
        this.wallet = storedWallet;
        // Don't create account here - require authentication first
        return storedWallet;
      }
      return null;
    } catch (error) {
      console.error('Wallet initialization error:', error);
      return null;
    }
  }

  // Authenticate and unlock wallet
  async authenticateAndUnlock(): Promise<StoredWalletData | null> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet found. Please login first.');
      }

      // Get wallet with authentication required
      const authenticatedWallet = await SecureStorage.getStoredWallet(true);
      if (!authenticatedWallet) {
        throw new Error('Authentication failed');
      }

      // Create Account instance
      this.account = new Account(
        this.provider,
        authenticatedWallet.address,
        authenticatedWallet.privateKey,
      );

      this.wallet = authenticatedWallet;
      return authenticatedWallet;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Login with Google and create/restore wallet
  async loginWithGoogle(): Promise<WalletData> {
    try {
      // Sign in with Google
      const authResult: GoogleAuthResult = await this.googleAuth.signIn();

      // Generate wallet from Google data
      const walletData = await WalletGenerator.generateWalletFromGoogle(
        authResult.idToken,
      );

      // Store wallet securely
      await SecureStorage.storeWallet(walletData);

      // Create Account instance
      this.account = new Account(
        this.provider,
        walletData.address,
        walletData.privateKey,
      );

      // Update internal state
      this.wallet = {
        ...walletData,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };

      return walletData;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Logout and clear wallet
  async logout(): Promise<void> {
    try {
      await this.googleAuth.signOut();
      await SecureStorage.clearAllData();
      this.wallet = null;
      this.account = null;
    } catch (error) {
      console.warn('Logout warning:', error);
      // Still clear local state even if remote logout fails
      this.wallet = null;
      this.account = null;
    }
  }

  // Get current wallet state
  getState(): WalletManagerState {
    return {
      isInitialized: this.wallet !== null,
      isLoggedIn: this.account !== null,
      wallet: this.wallet,
      account: this.account,
    };
  }

  // Get wallet info (safe - no private key)
  getWalletInfo(): Omit<StoredWalletData, 'privateKey'> | null {
    if (!this.wallet) return null;

    const { privateKey, ...safeWalletInfo } = this.wallet;
    return safeWalletInfo;
  }

  // Get account for transactions
  getAccount(): Account | null {
    return this.account;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.wallet !== null && this.account !== null;
  }

  // Check if wallet exists but not unlocked
  hasWallet(): boolean {
    return this.wallet !== null;
  }

  // Get wallet balance
  async getBalance(): Promise<string> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    try {
      // Get ETH balance (ETH contract on Starknet)
      const ethContractAddress =
        '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

      const balance = await this.provider.callContract({
        contractAddress: ethContractAddress,
        entrypoint: 'balanceOf',
        calldata: [this.account.address],
      });

      return balance[0];
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Send ETH transaction
  async sendETH(toAddress: string, amount: string): Promise<any> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    try {
      const call = {
        contractAddress:
          '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH contract
        entrypoint: 'transfer',
        calldata: CallData.compile([toAddress, amount, '0']),
      };

      const result = await this.account.execute(call);
      return result;
    } catch (error: any) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  // Get transaction history (simplified)
  async getTransactionHistory(): Promise<any[]> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    try {
      // This is a simplified version - in production you'd want to use a proper indexer
      // For now, return empty array
      return [];
    } catch (error: any) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  // Validate address format
  static isValidStarknetAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{1,64}$/.test(address);
  }

  // Format address for display
  static formatAddress(address: string, length: number = 10): string {
    if (!address) return '';
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }
}

export default StarknetWalletManager;
