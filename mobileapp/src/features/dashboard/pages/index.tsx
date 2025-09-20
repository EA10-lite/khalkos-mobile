import BgStrips from '@/assets/images/bg-strips.svg';
import Receive from '@/assets/images/receive.svg';
import Save from '@/assets/images/save.svg';
import Send from '@/assets/images/send.svg';
import Swap from '@/assets/images/swap.svg';
import {
    ReceiveModal,
    SendModal,
    SwapModal,
} from '@/src/features/dashboard/components';
import StarknetWalletManager from '@/src/features/wallet/services/StarknetWalletManager';
import { Navbar } from '@/src/shared/components';
import { Foundation, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

const TOKENS = [
  {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    image:
      'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1696507857',
    name: 'Wrapped Bitcoin',
    tokenPrice: '$100,000',
    symbol: 'wBTC',
    tokenBalance: '0.01',
    balanceValue: '$100',
  },
  {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    image:
      'https://assets.coingecko.com/coins/images/26433/large/starknet.png?1696525507',
    name: 'Starknet',
    tokenPrice: '$100,000',
    symbol: 'STRK',
    tokenBalance: '0.01',
    balanceValue: '$100',
  },
  {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    image:
      'https://assets.coingecko.com/coins/images/325/large/Tether.png?1696501661',
    name: 'Tether USDT',
    tokenPrice: '$100,000',
    symbol: 'USDT',
    tokenBalance: '0.01',
    balanceValue: '$100',
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    image:
      'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1747033532',
    name: 'Ethereum',
    tokenPrice: '$1,000',
    symbol: 'ETH',
    tokenBalance: '0.02',
    balanceValue: '$200',
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    image:
      'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
    name: 'USD Coin',
    tokenPrice: '$1',
    symbol: 'USDC',
    tokenBalance: '10',
    balanceValue: '$10',
  },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState<string>('assets');
  const [showPromoBanner, setShowPromoBanner] = useState<boolean>(true);
  const [isAddressCopied, setIsAddressCopied] = useState<boolean>(false);
  const [tokenBalances, setTokenBalances] = useState<any[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [totalUSDValue, setTotalUSDValue] = useState<number>(0);
  const [priceDataFailed, setPriceDataFailed] = useState<boolean>(false);

  const [isSendModalVisible, setIsSendModalVisible] = useState<boolean>(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState<boolean>(false);
  const [isReceiveModalVisible, setIsReceiveModalVisible] =
    useState<boolean>(false);

  const walletManager = StarknetWalletManager.getInstance();

  // Initialize wallet manager if needed
  const initializeWalletManager = async () => {
    try {
      if (!walletManager.hasWallet()) {
        console.log('Initializing wallet manager...');
        await walletManager.initialize();
      }
      
      if (!walletManager.isLoggedIn() && walletManager.hasWallet()) {
        console.log('Authenticating wallet...');
        await walletManager.authenticateAndUnlock();
      }
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
    }
  };

  // Load token balances with prices
  const loadTokenBalances = async (isRefresh = false) => {
    // Try to initialize wallet manager first
    await initializeWalletManager();
    
    if (!walletManager.isLoggedIn()) {
      console.log('User not logged in, skipping balance load');
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingBalances(true);
    }
    setBalanceError(null);
    
    try {
      const result = await walletManager.getAllTokenBalancesWithPrices();
      setTokenBalances(result.balances);
      setTotalUSDValue(result.totalUSD);
      setPriceDataFailed(result.priceDataFailed);
    } catch (error: any) {
      console.error('Failed to load token balances:', error);
      setBalanceError(error.message);
      setTokenBalances([]);
      setTotalUSDValue(0);
      setPriceDataFailed(false);
    } finally {
      setIsLoadingBalances(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTokenBalances();
  }, []);

  // Set up real-time balance monitoring
  useEffect(() => {
    if (!walletManager.isLoggedIn()) return;

    console.log('Setting up balance update listener...');
    const unsubscribe = walletManager.addBalanceUpdateListener(() => {
      console.log('Balance update detected, refreshing...');
      loadTokenBalances(true);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up balance update listener...');
      unsubscribe();
    };
  }, [walletManager.isLoggedIn()]);

  // Debug wallet state in development
  useEffect(() => {
    if (__DEV__) {
      console.log('Wallet Manager State:', {
        hasWallet: walletManager.hasWallet(),
        isLoggedIn: walletManager.isLoggedIn(),
        walletInfo: walletManager.getWalletInfo(),
      });
    }
  }, [tokenBalances]);

  // Handle pull-to-refresh
  const onRefresh = () => {
    loadTokenBalances(true);
  };

  const copyAddressToClipboard = async () => {
    try {

      const address = walletManager.getWalletInfo()?.address;
      if (address) {
        await Clipboard.setStringAsync(address);
        setIsAddressCopied(true);
        
        // Reset checkmark after 2 seconds
        setTimeout(() => {
          setIsAddressCopied(false);
        }, 2000);
      }
    } catch (error) {
      showMessage({
        message: 'Copy Failed',
        description: 'Unable to copy address to clipboard',
        type: 'danger',
      });
    }
  };

  const CTAS = [
    {
      title: 'Receive',
      onPress: () => setIsReceiveModalVisible(true),
      icon: <Receive />,
    },
    {
      title: 'Send',
      onPress: () => setIsSendModalVisible(true),
      icon: <Send />,
    },
    {
      title: 'Swap',
      onPress: () => setIsSwapModalVisible(true),
      icon: <Swap />,
    },
    {
      title: 'Save',
      onPress: () => {},
      icon: <Save />,
    },
  ];

  return (
    <View className="h-full w-full">
      <View className="bg-white">
        <Navbar />
      </View>

      <ScrollView 
        className="flex-1 bg-white" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            colors={['#000']}
          />
        }
      >
        <View className="px-6 mb-5">
          {/* Price Data Warning Banner */}
          {priceDataFailed && (
            <View className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#F59E0B" />
                <Text className="font-semibold text-yellow-800">Price data unavailable</Text>
              </View>
              <Text className="text-sm text-yellow-700 mb-3">
                Unable to fetch current market prices. Your token balances are accurate, but USD values may not be current.
              </Text>
              <TouchableOpacity 
                onPress={() => loadTokenBalances(true)}
                className="bg-yellow-600 px-4 py-2 rounded-lg self-start"
              >
                <Text className="text-white font-medium text-sm">Retry Price Data</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View className="my-5 bg-primary p-6 rounded-2xl relative overflow-hidden">
            <View className="absolute inset-0">
              <BgStrips width="500" height="200" />
            </View>
            
            <View className="relative z-10">
              <Text className='text-white font-medium mb-4'>Available balance</Text>
              <View className="flex-row items-start gap-1">
                <Foundation name="dollar" size={24} color={'#fff'} />
                <Text className="font-bold text-4xl text-white">
                  {totalUSDValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={copyAddressToClipboard}
                disabled={isAddressCopied}
                className="flex-row items-center gap-1 mt-2"
              >
                <Text className="text-white font-medium font-mono text-xs">
                  {walletManager.getWalletInfo()?.address 
                    ? `${walletManager.getWalletInfo()?.address.slice(0, 10)}...${walletManager.getWalletInfo()?.address.slice(-4)}`
                    : 'No address'
                  }
                </Text>
                <MaterialCommunityIcons 
                  name={isAddressCopied ? "check" : "content-copy"} 
                  size={12} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            {CTAS.map(cta => (
              <CTA
                title={cta.title}
                icon={cta.icon}
                onPress={cta.onPress}
                key={cta.title}
              />
            ))}
          </View>
        </View>

        {/* Promotional Banner */}
        {showPromoBanner && (
          <View className="">
            <View className="bg-primary relative px-6 p-4">
              <TouchableOpacity
                className="absolute right-6 top-3 z-10"
                onPress={() => setShowPromoBanner(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={'#FFFFFF'}
                />
              </TouchableOpacity>

              <View className="flex-row items-center gap-3 pr-8">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <MaterialCommunityIcons
                    name="gift"
                    size={24}
                    color={'#FFFFFF'}
                  />
                </View>

                <View className="flex-1">
                  <Text className="mb-1 font-medium text-base text-white">
                    Set your savings % and yield more rewards
                  </Text>
                  <TouchableOpacity className="flex-row items-center gap-1">
                    <Text className="font-semibold text-sm text-white">
                      Get started
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={'#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="bg-white p-6 pb-20">
          <View className="mb-8 flex-row items-center gap-4">
            <TouchableOpacity
              className={`flex-row items-center gap-2 ${activeTab === 'assets' ? 'text-black' : 'text-foreground'}`}
              onPress={() => setActiveTab('assets')}
            >
              <Text
                className={`font-semibold text-base ${activeTab === 'assets' ? 'text-black' : 'text-foreground'}`}
              >
                Assets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-row items-center gap-2 ${activeTab === 'savings' ? 'text-black' : 'text-foreground'}`}
              onPress={() => setActiveTab('savings')}
            >
              <Text
                className={`font-semibold text-base ${activeTab === 'savings' ? 'text-black' : 'text-foreground'}`}
              >
                Savings
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'assets' && (
            <View className="gap-6">
              {isLoadingBalances ? (
                <View className="flex-row items-center justify-center py-8">
                  <ActivityIndicator size="small" color="#000" />
                  <Text className="ml-3 text-base text-foreground">Loading balances...</Text>
                </View>
              ) : balanceError ? (
                <View className="items-center py-8">
                  <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
                  <Text className="text-red-500 text-lg font-semibold mb-2 mt-4">Unable to load balances</Text>
                  <Text className="text-foreground text-sm text-center mb-4 px-4">
                    There was an issue fetching your token balances. Please check your connection and try again.
                  </Text>
                  <TouchableOpacity 
                    onPress={() => loadTokenBalances(true)}
                    className="bg-black px-6 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold">Refresh Balances</Text>
                  </TouchableOpacity>
                </View>
              ) : tokenBalances.length > 0 ? (
                tokenBalances.map((tokenBalance) => (
                  <RealTokens 
                    key={tokenBalance.token.symbol} 
                    tokenBalance={tokenBalance} 
                  />
                ))
              ) : (
                // Fallback to hardcoded tokens if no real balances
                TOKENS.map(token => (
                  <Tokens key={token.name} {...token} />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <SendModal
        isVisible={isSendModalVisible}
        onClose={() => setIsSendModalVisible(false)}
      />
      <ReceiveModal
        isOpen={isReceiveModalVisible}
        closeModal={() => setIsReceiveModalVisible(false)}
      />
      <SwapModal
        isVisible={isSwapModalVisible}
        onClose={() => setIsSwapModalVisible(false)}
      />
    </View>
  );
};

type CTAProps = {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
};

const CTA = ({ title, icon, onPress }: CTAProps) => {
  return (
    <TouchableOpacity
      className="p-4.5 h-24 w-24 items-center justify-center gap-2 rounded-[16px] border-[2px] border-secondary py-4"
      onPress={onPress}
    >
      {icon}
      <Text className="font-semibold text-sm text-black">{title}</Text>
    </TouchableOpacity>
  );
};

type TokenProps = {
  image: string;
  name: string;
  tokenPrice: string;
  symbol: string;
  tokenBalance: string;
  balanceValue: string;
};

const Tokens = ({
  image,
  name,
  tokenPrice,
  symbol,
  tokenBalance,
  balanceValue,
}: TokenProps) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
          <Image source={{ uri: image }} className="h-12 w-12 rounded-full" />
        </View>

        <View className="">
          <Text className="mb-1 font-semibold text-lg text-black">{name}</Text>
          <Text className=" text-base text-foreground">{tokenPrice}</Text>
        </View>
      </View>
      <View className="">
        <Text className="mb-1 text-right font-semibold text-lg text-black">
          {tokenBalance} {symbol}
        </Text>
        <Text className="text-right text-base text-foreground">
          {balanceValue}
        </Text>
      </View>
    </View>
  );
};

// Component for displaying real token balances
type RealTokensProps = {
  tokenBalance: {
    token: {
      symbol: string;
      name: string;
      decimals: number;
      contractAddress: string;
    };
    balance: string;
    formattedBalance: string;
    usdPrice?: number;
    usdValue?: number;
  };
};

const RealTokens = ({ tokenBalance }: RealTokensProps) => {
  const { token, formattedBalance, usdPrice, usdValue } = tokenBalance;
  
  // Token image mapping - you can expand this
  const getTokenImage = (symbol: string) => {
    const images: { [key: string]: string } = {
      'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1747033532',
      'STRK': 'https://assets.coingecko.com/coins/images/26433/large/starknet.png?1696525507',
      'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1696501661',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
      'WBTC': 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1696507857',
    };
    return images[symbol] || 'https://via.placeholder.com/48';
  };


  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 overflow-hidden rounded-full bg-secondary">
          <Image 
            source={{ uri: getTokenImage(token.symbol) }} 
            className="h-12 w-12 rounded-full" 
          />
        </View>

        <View className="">
          <Text className="mb-1 font-semibold text-lg text-black">{token.name}</Text>
          <Text className="text-base text-foreground">{StarknetWalletManager.formatPrice(usdPrice)}</Text>
        </View>
      </View>
      <View className="">
        <Text className="mb-1 text-right font-semibold text-lg text-black">
          {formattedBalance} {token.symbol}
        </Text>
        <Text className="text-right text-base text-foreground">
          {StarknetWalletManager.formatUSDValue(usdValue)}
        </Text>
      </View>
    </View>
  );
};

export default Home;
