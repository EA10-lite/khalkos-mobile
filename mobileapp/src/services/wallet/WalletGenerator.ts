import CryptoJS from 'crypto-js';
import { ec, hash } from 'starknet';

export interface WalletData {
  privateKey: string;
  publicKey: string;
  address: string;
  googleUserId: string;
  email: string;
}

export interface KeyGenerationData {
  privateKey: string;
  googleUserId: string;
  email: string;
  seed: string;
}

class WalletGenerator {
  // Salt to make the key derivation unique to your app
  private static readonly APP_SALT = 'khalkos-mobile-wallet-2024';

  static generatePrivateKeyFromJWT(idToken: string): KeyGenerationData {
    try {
      // Decode JWT payload (middle part)
      const base64Payload = idToken.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));

      // Use Google's stable user identifier
      const googleUserId = payload.sub;
      const userEmail = payload.email;

      if (!googleUserId || !userEmail) {
        throw new Error('Invalid JWT payload: missing sub or email');
      }

      // Create deterministic seed
      const seed = `${googleUserId}-${this.APP_SALT}`;

      // Generate private key using SHA-256 hash
      const privateKeyHash = CryptoJS.SHA256(seed).toString();

      // Ensure it's a valid Starknet private key (32 bytes)
      const privateKey = '0x' + privateKeyHash;

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

  static createStarknetWallet(privateKey: string): {
    privateKey: string;
    publicKey: string;
    address: string;
  } {
    try {
      // Generate public key from private key
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      // Calculate wallet address using Account contract class hash
      // This is a simplified version - in production you might want to use a specific account contract
      const address = hash.calculateContractAddressFromHash(
        publicKey,
        hash.computeHashOnElements([publicKey]),
        [],
        0,
      );

      return {
        privateKey,
        publicKey,
        address,
      };
    } catch (error: any) {
      throw new Error(`Failed to create Starknet wallet: ${error.message}`);
    }
  }

  static async generateWalletFromGoogle(idToken: string): Promise<WalletData> {
    try {
      // Step 1: Generate deterministic private key
      const keyData = this.generatePrivateKeyFromJWT(idToken);

      // Step 2: Create Starknet wallet
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

  // Utility method to validate wallet data
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
}

export default WalletGenerator;
