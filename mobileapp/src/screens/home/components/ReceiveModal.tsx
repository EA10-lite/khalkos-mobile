import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReceiveModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const ReceiveModal = ({ isOpen, closeModal }: ReceiveModalProps) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal 
            isVisible={isOpen}
            onBackdropPress={closeModal}
            style={{ margin: 0, marginTop: insets.top }}
        >
            <View 
                className="bg-white px-6 py-8 rounded-[28px] absolute bottom-0 w-full h-full left-0 right-0"
                style={{ paddingTop: 16 }}
            >
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity onPress={closeModal}>
                        <Ionicons name="arrow-back-outline" size={24} color="black" />
                    </TouchableOpacity>

                    <Text className="text-lg font-semibold text-black">Receive</Text>

                    <MaterialCommunityIcons name="information-slab-circle" size={24} color="black" />
                </View>


                <View className="flex-row items-center justify-between">
                    <View className="warning bg-[#f6edd8] p-2.5 rounded-lg flex-row items-center gap-2">
                        <MaterialCommunityIcons name="information-slab-circle" size={24} color="#ca9012" />
                        <Text className="text-sm text-black flex-1">Only send Bitcoin (BTC) assets to this address. Other assets will be lost forever.</Text>
                    </View>

                    <View className="flex-row items-center justify-center">
                        <Text></Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ReceiveModal;