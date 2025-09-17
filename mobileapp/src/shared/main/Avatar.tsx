import { Image, Text, TouchableOpacity, View } from "react-native";

interface AvatarProps {
    name?: string;
    uri?: string;
    size?: number;
    handlePress?: () => void;
}

const Avatar = ({ name, uri, size = 12, handlePress }: AvatarProps) => {
    const getInitials = () => {
        if (!name) return "";
        const names = name.split(" ");
        return names[0][0] + names[names.length - 1][0];
    }

    return (
        <TouchableOpacity onPress={handlePress}>
            <View className={`w-${size} h-${size} rounded-full bg-purple items-center justify-center overflow-hidden`}>
                {uri ? (
                    <Image source={{ uri }} className={`w-${size} h-${size} rounded-full`} />
                ) : name && (
                    <Text className="text-white text-center text-lg font-semibold">{getInitials()}</Text>
                )}
            </View>
        </TouchableOpacity>
    )
}

export default Avatar;  