import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SwapModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const SwapModal = ({ isVisible, onClose }: SwapModalProps) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={isVisible}
            onRequestClose={onClose}
            transparent={true}
            animationType="slide"
        >
            <View 
                className="w-full h-full bg-white px-6"
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center justify-between">
                    <Text className="text-2xl font-bold text-black">Swap</Text>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="rounded-full bg-[#18181B14] w-8 h-8 items-center justify-center"
                    >
                        <Ionicons name="close" size={20} color={"#A1A1AA"} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const SwapForm = () => {
    return (
        <View>
            <Text>Swap Form</Text>
        </View>
    )
}

export default SwapModal;