import { Text, View } from 'react-native';

export default function Send() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-black">Send</Text>
      <Text className="text-base text-gray-600 mt-2">Send tokens to other wallets</Text>
    </View>
  );
}
