import * as Crypto from 'expo-crypto';
import { Account, CallData, ec, hash, num, PaymasterRpc, RpcProvider } from 'starknet';
import SecureStorage, { StoredWalletData } from '../../auth/services/SecureStorage';

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
  usdPrice?: number;
  usdValue?: number;
}

export interface WalletManagerState {
  isInitialized: boolean;
  isLoggedIn: boolean;
  wallet: StoredWalletData | null;
  account: Account | null;
}

export interface WalletData {
  privateKey: string;
  publicKey: string;
  address: string;
  googleUserId: string;
  email: string;
  calldata: any;
}

export interface KeyGenerationData {
  privateKey: string;
  googleUserId: string;
  email: string;
  seed: string;
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
  private static readonly APP_SALT = process.env.EXPO_PUBLIC_SALT;
  private static readonly OZ_ACCOUNT_CLASS_HASH = process.env.EXPO_PUBLIC_OZ_ACCOUNT_CLASS_HASH;
  
  // Event listeners for balance updates
  private balanceUpdateListeners: Set<() => void> = new Set();
  private isPolling: boolean = false;
  private pollingInterval: number | null = null;
  private lastKnownBalances: Map<string, string> = new Map();

  private constructor() {
    this.provider = new RpcProvider({
      nodeUrl: process.env.EXPO_PUBLIC_SEPOLIA_RPC,
    });
    this.strk_contract_address = process.env.EXPO_PUBLIC_STARK_SEPOLIA_CONTRACT_ADDRESS!;
    this.strk_usdt_contract_address = process.env.EXPO_PUBLIC_STARK_SEPOLIA_USDT_CONTRACT_ADDRESS!;
    this.strk_usdc_contract_address = process.env.EXPO_PUBLIC_STARK_SEPOLIA_USDC_CONTRACT_ADDRESS!;
    this.strk_wbtc_contract_address = process.env.EXPO_PUBLIC_STARK_SEPOLIA_WBTC_CONTRACT_ADDRESS!;
    this.strk_eth_contract_address = process.env.EXPO_PUBLIC_STARK_SEPOLIA_ETH_CONTRACT_ADDRESS!;

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
      if (storedWallet && StarknetWalletManager.validateWalletData(storedWallet)) {
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
      console.log('Creating wallet from Google authentication...');

      const walletData = await StarknetWalletManager.generateWalletFromGoogle(
        authResult.idToken,
      );

      console.log('Wallet generated:', {
        address: walletData.address,
        email: walletData.email
      });

      // Store wallet data securely
      await SecureStorage.storeWallet(walletData);

      // Create Account instance
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

      const isDeployed = await this.isWalletDeployed();

      if(!isDeployed){
        await this.deployWallet(walletData.calldata);
      }

      return {
        ...walletData,
      };
    } catch (error: any) {
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  static async generateWalletFromGoogle(idToken: string): Promise<WalletData> {
    try {
      const keyData = await this.generatePrivateKeyFromJWT(idToken);
      console.log("key_data", keyData);
      const wallet = this.createStarknetWallet(keyData.privateKey);

      return {
        ...wallet,
        googleUserId: keyData.googleUserId,
        email: keyData.email,
      };
    } catch (error: any) {
      throw new Error(`Wallet generation failed: ${error.message}`);
    }
  }


  static createStarknetWallet(privateKey: string): {
    privateKey: string;
    publicKey: string;
    address: string;
    calldata: string[];
  } {
    try {
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      const OZaccountConstructorCallData = CallData.compile({ publicKey: publicKey });
      const OZcontractAddress = hash.calculateContractAddressFromHash(
        publicKey,
        this.OZ_ACCOUNT_CLASS_HASH!,
        OZaccountConstructorCallData,
        0
      );

      // Ensure address is properly padded to 66 characters (0x + 64 hex chars)
      const paddedAddress = OZcontractAddress.length < 66 
        ? '0x' + OZcontractAddress.slice(2).padStart(64, '0')
        : OZcontractAddress;
      
      return {
        privateKey,
        publicKey,
        address: paddedAddress,
        calldata: OZaccountConstructorCallData
      };
    } catch (error: any) {
      throw new Error(`Failed to create Starknet wallet: ${error.message}`);
    }
  }

  static async generatePrivateKeyFromJWT(idToken: string): Promise<KeyGenerationData> {
    try {
      const base64Payload = idToken.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));

      const googleUserId = payload.sub;
      const userEmail = payload.email;

      if (!googleUserId || !userEmail) {
        throw new Error('Invalid JWT payload: missing sub or email');
      }

      // Create deterministic seed
      const seed = `${googleUserId}-${this.APP_SALT}`;

      // Generate private key using SHA-256 hash
      const privateKeyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        seed,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Ensure it's a valid Starknet private key by using modulo with the curve order
      const hashBigInt = BigInt('0x' + privateKeyHash);
      const curveOrder = BigInt('0x0800000000000011000000000000000000000000000000000000000000000001');
      const validPrivateKey = (hashBigInt % (curveOrder - 1n)) + 1n;
      
      const privateKey = '0x' + validPrivateKey.toString(16).padStart(64, '0');

      return {
        privateKey,
        googleUserId,
        email: userEmail,
        seed, // Store seed for debugging (remove in production)
      };
    } catch (error: any) {
      throw new Error(`Failed to generate private key: ${error.message}`);
    }
  }


  static validateWalletData(walletData: any): walletData is WalletData {
    return (
      walletData &&
      typeof walletData.privateKey === 'string' &&
      typeof walletData.publicKey === 'string' &&
      typeof walletData.address === 'string' &&
      typeof walletData.googleUserId === 'string' &&
      typeof walletData.email === 'string' &&
      walletData.privateKey.startsWith('0x') &&
      walletData.address.startsWith('0x')
    );
  }

  async authenticateAndUnlock(): Promise<StoredWalletData | null> {
    try {

      const authenticatedWallet = await SecureStorage.getStoredWallet(false); // Temporarily disabled auth for development
      if (!authenticatedWallet) {
        throw new Error('Authentication failed');
      }

      this.account = new Account(
        this.provider,
        authenticatedWallet.address,
        authenticatedWallet.privateKey,
      );

      this.wallet = authenticatedWallet;
      
      // Initialize balance tracking for real-time updates
      await this.initializeBalanceTracking();
      
      return authenticatedWallet;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async logout(): Promise<void> {
    try {
      // Stop balance polling on logout
      this.stopBalancePolling();
      this.lastKnownBalances.clear();
      
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

    // Ensure address is properly padded for existing wallets
    const paddedAddress = this.ensureAddressPadding(safeWalletInfo.address);

    return {
      ...safeWalletInfo,
      address: paddedAddress
    };
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

  // Fetch token prices from CoinGecko
  private async fetchTokenPrices(): Promise<{ [key: string]: number }> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,starknet,tether,usd-coin,wrapped-bitcoin&vs_currencies=usd`
      );
      const data = await response.json();
      
      // Map symbols to CoinGecko IDs
      const priceMap: { [key: string]: number } = {
        'ETH': data.ethereum?.usd || 0,
        'STRK': data.starknet?.usd || 0,
        'USDT': data.tether?.usd || 0,
        'USDC': data['usd-coin']?.usd || 0,
        'WBTC': data['wrapped-bitcoin']?.usd || 0,
      };

      console.log("priceMap", priceMap)
      
      return priceMap;
    } catch (error) {
      console.error('Failed to fetch token prices:', error);
      return {};
    }
  }

  // Get all token balances with USD values
  async getAllTokenBalancesWithPrices(): Promise<{ balances: TokenBalance[], totalUSD: number, priceDataFailed: boolean }> {
    if (!this.account) {
      throw new Error('Not authenticated. Please unlock your wallet.');
    }

    try {
      // Fetch balances and prices in parallel
      const [balances, prices] = await Promise.all([
        this.getAllTokenBalances(),
        this.fetchTokenPrices()
      ]);

      // Check if all prices are 0 (API failure)
      const priceValues = Object.values(prices);
      const allPricesZero = priceValues.length > 0 && priceValues.every(price => price === 0);
      
      console.log('Price data status:', { 
        prices, 
        allPricesZero,
        priceCount: priceValues.length 
      });

      // Calculate USD values
      let totalUSD = 0;
      const balancesWithUSD = balances.map((balance) => {
        const price = prices[balance.token.symbol] || 0;
        const balanceNumber = parseFloat(balance.formattedBalance) || 0;
        const usdValue = balanceNumber * price;
        totalUSD += usdValue;

        return {
          ...balance,
          usdPrice: price,
          usdValue: usdValue
        };
      });

      return {
        balances: balancesWithUSD,
        totalUSD: totalUSD,
        priceDataFailed: allPricesZero
      };
    } catch (error: any) {
      throw new Error(`Failed to get token balances with prices: ${error.message}`);
    }
  }

  // Deploy wallet manually (if initial deployment failed)
  async deployWallet(calldata: any): Promise<any> {
    if (!this.wallet) {
      throw new Error('No wallet found. Please login first.');
    }
    console.log("avnu_api_key", process.env.EXPO_PUBLIC_AVNU_API_KEY)
    const myPaymasterRpc = new PaymasterRpc({
      nodeUrl: process.env.EXPO_PUBLIC_SEPOLIA_AVNU_RPC,
      headers: { 'x-paymaster-api-key': process.env.EXPO_PUBLIC_AVNU_API_KEY },
    });
    

    try {
      const OZaccount = new Account(
        this.provider, 
        this.wallet.address, 
        this.wallet.privateKey,
        undefined,
        undefined,
        myPaymasterRpc
      );
    
      // Convert calldata to hex format for paymaster
      const constructorHex: string[] = calldata.map((v: any) => num.toHex(v));

      const deploymentData = {
        class_hash: process.env.EXPO_PUBLIC_OZ_ACCOUNT_CLASS_HASH!,
        salt: this.wallet.publicKey,
        calldata: constructorHex,
        address: this.wallet.address,
        version: 1,
      } as const;

      const paymasterDetails = {
        feeMode: { mode: "sponsored" as const }, 
        deploymentData,
      };
  
      console.log("Deploying account with sponsored paymaster...");

      const result = await OZaccount.executePaymasterTransaction(
        [],
        paymasterDetails,
        undefined
      );

      console.log("Deployment successful!");
      console.log("Transaction hash:", result.transaction_hash);

    return {
      transaction_hash: result.transaction_hash,
      contract_address: this.wallet.address,
    };
    } catch (error: any) {
      throw new Error(`Manual deployment failed: ${error.message}`);
    }
  }

  // Check if wallet is deployed on-chain
  async isWalletDeployed(): Promise<boolean> {
    if (!this.wallet) {
      return false;
    }

    try {
      // Try to call a simple method on the account to check if it's deployed
      const response = await this.provider.callContract({
        contractAddress: this.wallet.address,
        entrypoint: 'get_public_key',
        calldata: [],
      });
      
      return response && response.length > 0;
    } catch (error) {
      console.log(error)
      return false;
    }
  }

  // Helper method to ensure address is properly padded
  private ensureAddressPadding(address: string): string {
    if (!address || !address.startsWith('0x')) return address;
    
    // Ensure address is properly padded to 66 characters (0x + 64 hex chars)
    return address.length < 66 
      ? '0x' + address.slice(2).padStart(64, '0')
      : address;
  }

  static isValidStarknetAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{1,64}$/.test(address);
  }

  static formatAddress(address: string, length: number = 10): string {
    if (!address) return '';
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  // Event listener methods for balance updates
  addBalanceUpdateListener(callback: () => void): () => void {
    this.balanceUpdateListeners.add(callback);
    
    // Start polling if this is the first listener
    if (this.balanceUpdateListeners.size === 1 && !this.isPolling) {
      this.startBalancePolling();
    }
    
    // Return unsubscribe function
    return () => {
      this.balanceUpdateListeners.delete(callback);
      
      // Stop polling if no more listeners
      if (this.balanceUpdateListeners.size === 0) {
        this.stopBalancePolling();
      }
    };
  }

  private startBalancePolling(): void {
    if (this.isPolling || !this.account) return;
    
    console.log('Starting balance polling...');
    this.isPolling = true;
    
    // Poll every 10 seconds
    this.pollingInterval = setInterval(async () => {
      await this.checkForBalanceChanges();
    }, 10000);
  }

  private stopBalancePolling(): void {
    if (!this.isPolling) return;
    
    console.log('Stopping balance polling...');
    this.isPolling = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkForBalanceChanges(): Promise<void> {
    if (!this.account) return;
    
    try {
      // Get current balances for comparison
      const currentBalances = await this.getAllTokenBalances();
      let hasChanges = false;
      
      for (const balance of currentBalances) {
        const tokenKey = balance.token.symbol;
        const lastKnownBalance = this.lastKnownBalances.get(tokenKey);
        
        if (lastKnownBalance !== balance.balance) {
          console.log(`Balance change detected for ${tokenKey}: ${lastKnownBalance} -> ${balance.balance}`);
          this.lastKnownBalances.set(tokenKey, balance.balance);
          hasChanges = true;
        }
      }
      
      // Notify listeners if any balance changed
      if (hasChanges) {
        console.log('Notifying balance update listeners...');
        this.balanceUpdateListeners.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error('Error in balance update listener:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error checking balance changes:', error);
    }
  }

  // Initialize balance tracking
  private async initializeBalanceTracking(): Promise<void> {
    if (!this.account) return;
    
    try {
      const balances = await this.getAllTokenBalances();
      balances.forEach(balance => {
        this.lastKnownBalances.set(balance.token.symbol, balance.balance);
      });
      console.log('Balance tracking initialized with:', this.lastKnownBalances);
    } catch (error) {
      console.error('Failed to initialize balance tracking:', error);
    }
  }

  static formatUSDValue = (value: number | undefined) => {
    if (!value || value === 0) return '$0.00';
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  static formatPrice = (price: number | undefined) => {
    if (!price || price === 0) return '$0.00';
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })}`;
  };

}

export default StarknetWalletManager;
