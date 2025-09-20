import { Text, View } from 'react-native';

export default function Profile() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-black">Profile</Text>
      <Text className="text-base text-gray-600 mt-2">Manage your profile and settings</Text>
    </View>
  );
}
