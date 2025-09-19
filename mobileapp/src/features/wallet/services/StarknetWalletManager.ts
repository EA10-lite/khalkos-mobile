import { Account, RpcProvider } from 'starknet';
import SecureStorage, { StoredWalletData } from '../../auth/services/SecureStorage';
import WalletGenerator, { WalletData } from './WalletGenerator';


export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
}

export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  formattedBalance: string;
}

export interface WalletManagerState {
  isInitialized: boolean;
  isLoggedIn: boolean;
  wallet: StoredWalletData | null;
  account: Account | null;
}

class StarknetWalletManager {
  private static instance: StarknetWalletManager;
  private provider: RpcProvider;
  private strk_contract_address: string;
  private strk_usdt_contract_address: string;
  private strk_usdc_contract_address: string;
  private strk_wbtc_contract_address: string;
  private strk_eth_contract_address: string;
  private wallet: StoredWalletData | null = null;
  private account: Account | null = null;
  private supportedTokens: TokenInfo[] = [];

  private constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC,
    });
    this.strk_contract_address = process.env.EXPO_PUBLIC_STARK_CONTRACT_ADDRESS!;
    this.strk_usdt_contract_address = process.env.EXPO_PUBLIC_STARK_USDT_CONTRACT_ADDRESS!;
    this.strk_usdc_contract_address = process.env.EXPO_PUBLIC_STARK_USDC_CONTRACT_ADDRESS!;
    this.strk_wbtc_contract_address = process.env.EXPO_PUBLIC_STARK_WBTC_CONTRACT_ADDRESS!;
    this.strk_eth_contract_address = process.env.EXPO_PUBLIC_STARK_ETH_CONTRACT_ADDRESS!;
    this.initializeSupportedTokens();
  }

  private initializeSupportedTokens(): void {
    this.supportedTokens = [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        contractAddress: this.strk_eth_contract_address,
      },
      {
        symbol: 'STRK',
        name: 'Starknet Token',
        decimals: 18,
        contractAddress: this.strk_contract_address,
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        contractAddress: this.strk_usdt_contract_address,
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        contractAddress: this.strk_usdc_contract_address,
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        decimals: 8,
        contractAddress: this.strk_wbtc_contract_address,
      },
    ];
  }

  static getInstance(): StarknetWalletManager {
    if (!StarknetWalletManager.instance) {
      StarknetWalletManager.instance = new StarknetWalletManager();
    }
    return StarknetWalletManager.instance;
  }

  async initialize(): Promise<StoredWalletData | null> {
    try {

      const storedWallet = await SecureStorage.getStoredWallet(false);
      if (storedWallet && WalletGenerator.validateWalletData(storedWallet)) {
        this.wallet = storedWallet;
        return storedWallet;
      }
      return null;
    } catch (error) {
      console.error('Wallet initialization error:', error);
      return null;
    }
  }
  async createWalletFromGoogle(authResult: any): Promise<WalletData> {
    try {
      
      const walletData = await WalletGenerator.generateWalletFromGoogle(
        authResult.idToken,
      );

      await SecureStorage.storeWallet(walletData);

      this.account = new Account(
        this.provider,
        walletData.address,
        walletData.privateKey,
      );

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

  async authenticateAndUnlock(): Promise<StoredWalletData | null> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet found. Please login first.');
      }

      const authenticatedWallet = await SecureStorage.getStoredWallet(true);
      if (!authenticatedWallet) {
        throw new Error('Authentication failed');
      }

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

  async logout(): Promise<void> {
    try {
      await SecureStorage.clearAllData();
      this.wallet = null;
      this.account = null;
    } catch (error) {
      console.warn('Logout warning:', error);
      this.wallet = null;
      this.account = null;
    }
  }

  getState(): WalletManagerState {
    return {
      isInitialized: this.wallet !== null,
      isLoggedIn: this.account !== null,
      wallet: this.wallet,
      account: this.account,
    };
  }

  getWalletInfo(): Omit<StoredWalletData, 'privateKey'> | null {
    if (!this.wallet) return null;

    const { privateKey, ...safeWalletInfo } = this.wallet;
    return safeWalletInfo;
  }

  getAccount(): Account | null {
    return this.account;
  }

  isLoggedIn(): boolean {
    return this.wallet !== null && this.account !== null;
  }

  hasWallet(): boolean {
    return this.wallet !== null;
  }

  async getBalance(): Promise<string> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    try {
      const ethToken = this.supportedTokens.find(token => token.symbol === 'ETH');
      if (!ethToken) {
        throw new Error('ETH token configuration not found');
      }

      const balance = await this.provider.callContract({
        contractAddress: ethToken.contractAddress,
        entrypoint: 'balanceOf',
        calldata: [this.account.address],
      });

      return balance[0];
    } catch (error: any) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getTokenBalance(tokenSymbol: string): Promise<TokenBalance> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    const token = this.supportedTokens.find(t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase());
    if (!token) {
      throw new Error(`Token ${tokenSymbol} is not supported`);
    }

    try {
      const balance = await this.provider.callContract({
        contractAddress: token.contractAddress,
        entrypoint: 'balanceOf',
        calldata: [this.account.address],
      });

      const rawBalance = balance[0];
      const formattedBalance = this.formatTokenBalance(rawBalance, token.decimals);

      return {
        token,
        balance: rawBalance,
        formattedBalance,
      };
    } catch (error: any) {
      throw new Error(`Failed to get ${tokenSymbol} balance: ${error.message}`);
    }
  }

  async getAllTokenBalances(): Promise<TokenBalance[]> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    const balancePromises = this.supportedTokens.map(async (token) => {
      try {
        const balance = await this.provider.callContract({
          contractAddress: token.contractAddress,
          entrypoint: 'balanceOf',
          calldata: [this.account!.address],
        });

        const rawBalance = balance[0];
        const formattedBalance = this.formatTokenBalance(rawBalance, token.decimals);

        return {
          token,
          balance: rawBalance,
          formattedBalance,
        };
      } catch (error: any) {
        console.warn(`Failed to get balance for ${token.symbol}:`, error.message);
        return {
          token,
          balance: '0',
          formattedBalance: '0.00',
        };
      }
    });

    try {
      const balances = await Promise.all(balancePromises);
      return balances;
    } catch (error: any) {
      throw new Error(`Failed to get token balances: ${error.message}`);
    }
  }

  private formatTokenBalance(rawBalance: string, decimals: number): string {
    try {
      const balance = BigInt(rawBalance);
      const divisor = BigInt(10 ** decimals);
      const wholePart = balance / divisor;
      const fractionalPart = balance % divisor;
      
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '').slice(0, 6); 
      
      if (trimmedFractional === '') {
        return wholePart.toString();
      }
      
      return `${wholePart.toString()}.${trimmedFractional}`;
    } catch (error) {
      console.warn('Error formatting balance:', error);
      return '0.00';
    }
  }

  getSupportedTokens(): TokenInfo[] {
    return [...this.supportedTokens];
  }

  static isValidStarknetAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{1,64}$/.test(address);
  }

  static formatAddress(address: string, length: number = 10): string {
    if (!address) return '';
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }
}

export default StarknetWalletManager;
