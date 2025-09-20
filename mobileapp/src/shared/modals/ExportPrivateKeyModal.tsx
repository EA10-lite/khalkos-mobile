import SecureStorage from '@/src/features/auth/services/SecureStorage';
import StarknetWalletManager from '@/src/features/wallet/services/StarknetWalletManager';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExportPrivateKeyModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const ExportPrivateKeyModal = ({ isOpen, closeModal }: ExportPrivateKeyModalProps) => {
  const insets = useSafeAreaInsets();
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleAuthenticate = async () => {
    setIsLoading(true);
    try {
      const biometricAuth = await SecureStorage.authenticateUser('Authenticate to export your private key');
      
      if (biometricAuth) {
        await loadPrivateKey();
      } else {
        Alert.alert(
          'Authentication Required',
          'Please authenticate to export your private key',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: handleAuthenticate }
          ]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showMessage({
        message: 'Authentication Failed',
        description: 'Unable to authenticate. Please try again.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrivateKey = async () => {
    try {
      const walletManager = StarknetWalletManager.getInstance();
      const walletInfo = walletManager.getWalletInfo();
      
      if (walletInfo) {
        const fullWalletData = await SecureStorage.getStoredWallet(false);
        if (fullWalletData?.privateKey) {
          setPrivateKey(fullWalletData.privateKey);
          setIsAuthenticated(true);
        } else {
          throw new Error('Private key not found');
        }
      } else {
        throw new Error('Wallet not initialized');
      }
    } catch (error) {
      console.error('Error loading private key:', error);
      showMessage({
        message: 'Error',
        description: 'Unable to load private key. Please try again.',
        type: 'danger',
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(privateKey);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
      
    } catch (error) {
      showMessage({
        message: 'Copy Failed',
        description: 'Unable to copy to clipboard',
        type: 'danger',
      });
    }
  };

  const handleClose = () => {
    setPrivateKey('');
    setIsAuthenticated(false);
    setIsCopied(false);
    closeModal();
  };

  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      style={{ margin: 0, marginTop: insets.top }}
    >
      <View
        className="absolute bottom-0 left-0 right-0 h-full w-full rounded-[28px] bg-white px-6 py-8"
        style={{ paddingTop: 16 }}
      >
        {/* Swipe Indicator */}
        <View className="mb-4 items-center">
          <View className="h-1 w-12 rounded-full bg-gray-300" />
        </View>
        
        <View className="flex-1">
          <View className="mb-6">
            <Text className="text-xl font-bold text-black text-center">Export Private Key</Text>
          </View>

          {!isAuthenticated ? (
            <View className="flex-1 items-center justify-center px-4">
              <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-red-50">
                <MaterialCommunityIcons name="key" size={40} color="#EF4444" />
              </View>
              
              <Text className="mb-4 text-center text-lg font-semibold text-black">
                Authentication Required
              </Text>
              
              <Text className="mb-8 text-center text-base text-gray-600">
                Please authenticate to view your private key. This is a sensitive operation that requires verification.
              </Text>

              <TouchableOpacity
                onPress={handleAuthenticate}
                disabled={isLoading}
                className="w-full rounded-2xl bg-black py-4 px-6"
              >
                <Text className="text-center font-semibold text-white">
                  {isLoading ? 'Authenticating...' : 'Authenticate'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1">
              <View className="mb-6 rounded-2xl bg-red-50 p-4">
                <View className="mb-3 flex-row items-center gap-2">
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                  <Text className="font-bold text-red-600">Security Warning</Text>
                </View>
                <Text className="text-sm text-red-700">
                  • Never share your private key with anyone{'\n'}
                  • Anyone with your private key can access your wallet{'\n'}
                  • Store it in a secure location{'\n'}
                  • Consider writing it down and storing offline
                </Text>
              </View>

              <View className="mb-6">
                <Text className="mb-3 font-semibold text-gray-700">Your Private Key:</Text>
                
                <View className="rounded-2xl bg-gray-50 p-4">
                  <Text className="mb-4 text-sm text-black" selectable>
                    {privateKey}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={copyToClipboard}
                    className={`flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                      isCopied ? 'bg-green-600' : 'bg-black'
                    }`}
                    disabled={isCopied}
                  >
                    <MaterialCommunityIcons 
                      name={isCopied ? "check" : "content-copy"} 
                      size={18} 
                      color="white" 
                    />
                    <Text className="font-semibold text-white">
                      {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="rounded-2xl bg-blue-50 p-4">
                <View className="mb-2 flex-row items-center gap-2">
                  <MaterialCommunityIcons name="information" size={18} color="#304FFF" />
                  <Text className="font-semibold text-blue-700">Important</Text>
                </View>
                <Text className="text-sm text-blue-700">
                  This private key gives full control over your wallet. Keep it safe and never enter it on suspicious websites or apps.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ExportPrivateKeyModal;
