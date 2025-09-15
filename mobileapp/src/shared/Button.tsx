import { Text, TouchableOpacity } from "react-native";


interface ButtonProps {
    title: string;
    onPress?: () => void;
}

const Button = ({ title, onPress }: ButtonProps) => {
    return (
        <TouchableOpacity
            className="w-full bg-primary py-4 px-6 rounded-[12px] my-4"
            onPress={onPress}
        >
            <Text className="text-white text-center text-lg font-semibold">
                {title}
            </Text>
        </TouchableOpacity>
    )
}

export default Button;