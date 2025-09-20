import { Text, View } from 'react-native';

export default function History() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-black">Transaction History</Text>
      <Text className="text-base text-gray-600 mt-2">View your transaction history</Text>
    </View>
  );
}
