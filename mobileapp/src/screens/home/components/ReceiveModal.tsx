import { Token } from "@/src/shared/constants/tokens";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { Alert, Image, Share, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReceiveModalProps {
    isOpen: boolean;
    closeModal: () => void;
    token: Token;
}

const ReceiveModal = ({ isOpen, closeModal, token}: ReceiveModalProps) => {
    const insets = useSafeAreaInsets();

    const handleCopyAddress = async () => {
        try {
            await Clipboard.setStringAsync(token.address);
            Alert.alert("Copied!", `${token.symbol} address copied to clipboard`);
        } catch (error) {
            console.error("Copy error:", error);
            Alert.alert("Error", "Failed to copy address");
        }
    };

    const handleShareAddress = async () => {
        try {
            await Share.share({
                message: `My ${token.name} (${token.symbol}) address:\n\n${token.address}`,
                title: `${token.symbol} Address`,
            });
        } catch (error) {
            Alert.alert("Error", "Failed to share address");
        }
    };

    

    const actions = [
        {
            title: "Copy",
            onPress: handleCopyAddress,
            icon: <Ionicons name="copy" size={24} color="black" />
        },
        {
            title: "Set Amount",
            onPress: () => {},
            icon: <Ionicons name="reader-sharp" size={24} color="black" />
        },
        {
            title: "Share",
            onPress: handleShareAddress,
            icon: <Ionicons name="share-social" size={24} color="black" />
        }
    ]

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


                <View className="">
                    <View className="warning bg-[#f6edd8] p-2.5 rounded-lg flex-row items-center gap-2">
                        <MaterialCommunityIcons name="information-slab-circle" size={24} color="#ca9012" />
                        <Text className="text-sm text-black flex-1">Only send {token.name} ({token.symbol}) assets to this address. Other assets will be lost forever.</Text>
                    </View>


                    {/* QR CODE DISPLAY */}
                    <View className="items-center justify-center my-8">
                        {token && (
                            <View className="flex-row items-center justify-center gap-2 mb-4">
                                <Image 
                                    source={{ uri: token.image }} 
                                    className="w-10 h-10 rounded-full" 
                                />
                                <Text className="text-sm text-black">{token.symbol}</Text>
                                <View className="bg-secondary rounded-lg px-2 py-1">
                                    <Text className="text-sm text-black">{token.name}</Text>
                                </View>
                            </View>
                        )}
                        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 w-[208px] mx-auto p-4">
                            <QRCode
                                value={token.address}
                                size={180}
                                backgroundColor="white"
                                color="black"
                                
                            />
                            
                            <Text className="text-center text-sm font-semibold text-black break-all mt-2">
                                {token.address}
                            </Text>
                        </View>
                    </View>


                    <View className="flex-row items-center justify-center gap-12">
                        {actions.map((action, index) => (
                            <ActionButton 
                                key={index} 
                                icon={action.icon} 
                                title={action.title} 
                                onPress={action.onPress} 
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};


type ActionButtonProps = {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
}

const ActionButton = ({ icon, title, onPress }: ActionButtonProps) => {
    return (
        <View className="items-center">
            <TouchableOpacity 
                className="items-center justify-center rounded-full bg-[#ededed] w-16 h-16"
                onPress={onPress}
            >
                {icon}
            </TouchableOpacity>
            <Text className="text-black text-sm font-semibold">{title}</Text>
        </View>
    )
}

export default ReceiveModal;