import { Image, Text, View } from "react-native";

interface AvatarProps {
    name?: string;
    uri?: string;
}

const Avatar = ({ name, uri }: AvatarProps) => {
    const getInitials = () => {
        if (!name) return "";
        const names = name.split(" ");
        return names[0][0] + names[names.length - 1][0];
    }

    return (
        <View className="w-12 h-12 rounded-full bg-purple items-center justify-center overflow-hidden">
            {uri ? (
                <Image source={{ uri }} className="w-12 h-12 rounded-full" />
            ) : name && (
                <Text className="text-white text-center text-lg font-semibold">{getInitials()}</Text>
            )}
        </View>
    )
}

export default Avatar;  