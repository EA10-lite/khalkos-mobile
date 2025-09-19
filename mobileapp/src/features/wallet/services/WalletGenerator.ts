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
  
  private static readonly APP_SALT = process.env.EXPO_PRIVATE_SALT;

  static generatePrivateKeyFromJWT(idToken: string): KeyGenerationData {
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
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

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
      const keyData = this.generatePrivateKeyFromJWT(idToken);
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
