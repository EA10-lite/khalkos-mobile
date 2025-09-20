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
import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

  const [isSendModalVisible, setIsSendModalVisible] = useState<boolean>(false);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState<boolean>(false);
  const [isReceiveModalVisible, setIsReceiveModalVisible] =
    useState<boolean>(false);

  const walletManager = StarknetWalletManager.getInstance();

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
      >
        <View className="px-6 mb-5">
          <View className="my-5 bg-primary p-6 rounded-2xl relative overflow-hidden">
            <View className="absolute inset-0">
              <BgStrips width="500" height="200" />
            </View>
            
            <View className="relative z-10">
              <Text className='text-white font-medium mb-4'>Available balance</Text>
              <View className="flex-row items-start gap-1">
                <Foundation name="dollar" size={24} color={'#fff'} />
                <Text className="font-bold text-4xl text-white">45,000</Text>
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
              {TOKENS.map(token => (
                <Tokens key={token.name} {...token} />
              ))}
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

export default Home;
