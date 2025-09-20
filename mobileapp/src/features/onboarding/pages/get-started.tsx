import Stargrey from '@/assets/images/star-grey.svg';
import Star from '@/assets/images/star.svg';
import { SecureStorage } from '@/src/features/auth';
import { Button } from '@/src/shared/components';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GetStarted = () => {
  const insets = useSafeAreaInsets();
  const [hasPinSet, setHasPinSet] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const pinExists = await SecureStorage.hasPinSet();
    setHasPinSet(pinExists);
  };

  const handleContinue = () => {
    if (hasPinSet) {
      router.replace('/(main)/(tabs)/home');
    } else {
      router.push('/(auth)/pin-setup');
    }
  };

  return (
    <View
      className="h-full w-full bg-white p-6"
      style={{
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
      }}
    >
      <View className="mt-12 grow">
        <View className="mx-auto mb-12 max-w-[200px]">
          <Text className="text-center font-bold text-2xl text-black">
            <Text className="text-purple">Sweet!</Text> Your new wallet is
            ready!
          </Text>
        </View>

        <View className="items-center justify-center">
          <View className="w-full flex-row items-center justify-between px-6">
            <Stargrey />
            <Star />
          </View>

          <Image
            source={require('@/assets/images/wallet.png')}
            className="h-[18rem] w-[18rem]"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="">
        <Text className="mb-4 text-center font-bold text-2xl text-black">
          Let's get started
        </Text>

        <View className="mb-8 flex-row items-center gap-3 rounded-xl bg-[#18181B05] px-6 py-4">
          <View className="">
            <Image
              source={require('@/assets/images/wallet-small.png')}
              className="h-8 w-8"
              resizeMode="contain"
            />
          </View>

          <View>
            <Text className="font-semibold text-lg text-black">
              Start saving
            </Text>
            <Text className="font-medium text-sm text-foreground">
              Give your savings a purpose
            </Text>
          </View>
        </View>

        <Button
          title={hasPinSet ? 'View wallet' : 'Set up security'}
          onPress={handleContinue}
        />
      </View>
    </View>
  );
};

export default GetStarted;
