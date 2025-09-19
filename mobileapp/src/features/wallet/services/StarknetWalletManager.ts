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
  private static readonly APP_SALT = process.env.EXPO_PRIVATE_SALT;
  private static readonly OZ_ACCOUNT_CLASS_HASH = process.env.EXPO_PUBLIC_OZ_ACCOUNT_CLASS_HASH;

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
      
      return {
        privateKey,
        publicKey,
        address: OZcontractAddress,
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
      if (!this.wallet) {
        throw new Error('No wallet found. Please login first.');
      }

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

  // Deploy wallet manually (if initial deployment failed)
  async deployWallet(calldata: any): Promise<any> {
    if (!this.wallet) {
      throw new Error('No wallet found. Please login first.');
    }

    const myPaymasterRpc = new PaymasterRpc({
      nodeUrl: process.env.EXPO_PUBLIC_SEPOLIA_AVNU_RPC,
      headers: { 'api-key': process.env.EXPO_PRIVATE_AVNU_API_KEY },
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
        feeMode: { mode: "sponsored" as const }, // Use sponsored mode for free deployment
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
      return false;
    }
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
