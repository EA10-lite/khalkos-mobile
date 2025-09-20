import { Image, Text, TouchableOpacity, View } from 'react-native';

interface AvatarProps {
  name?: string;
  uri?: string;
  handlePress?: () => void;
}

const Avatar = ({ name, uri, handlePress }: AvatarProps) => {
  const getInitials = () => {
    if (!name) return '';
    const names = name.split(' ');
    return names[0][0] + names[names.length - 1][0];
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View
        className={`w-12 h-12 items-center justify-center overflow-hidden rounded-full bg-purple`}
      >
        {uri ? (
          <Image
            source={{ uri }}
            className={`w-12 h-12 rounded-full`}
          />
        ) : (
          name && (
            <Text className="text-center font-semibold text-2xl text-white">
              {getInitials()}
            </Text>
          )
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Avatar;
