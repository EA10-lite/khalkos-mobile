import { MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TokenDropdownProps {
    isOpen: boolean;
    closeModal: () => void;
    tokens: TokenProps[];
    selectedToken: string;
    setSelectedToken: (token: TokenProps) => void;
}

type TokenProps = {
    image: string;
    name: string;
    tokenPrice: string;
    symbol: string;
    tokenBalance: string;
    balanceValue: string;
}
const TokenDropdown = ({ isOpen, closeModal, tokens, selectedToken, setSelectedToken }: TokenDropdownProps) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal 
            isVisible={isOpen} 
            onBackdropPress={closeModal}
            style={{ margin: 0 }}
        >
            <View 
                className="bg-white py-8 rounded-[28px] absolute bottom-0 w-full left-0 right-0"
                style={{ paddingBottom: insets.bottom }}
            >
                <View className="flex-row items-center justify-between gap-2 mb-8 px-6">
                    <Text className="text-black font-[600] text-2xl">Choose Token</Text>

                    <TouchableOpacity 
                        onPress={closeModal}
                    >
                        <MaterialIcons name="close" size={24} color="black" className="ml-[8px]" />
                    </TouchableOpacity>
                </View>


                <View className="">
                    <View className="gap-2">
                        {tokens.map((token) => (
                            <Tokens 
                                key={token.name} 
                                {...token} 
                                onPress={() => {
                                    setSelectedToken(token)
                                    closeModal()
                                }}
                                isSelected={selectedToken === token.name}
                            />
                        ))}
                    </View>
                </View>
            </View>

        </Modal>
    )
}

interface TokensProps extends TokenProps {
    onPress: () => void;
    isSelected: boolean;
}

const Tokens = ({ image, name, tokenPrice, symbol, tokenBalance, balanceValue, onPress, isSelected }: TokensProps) => {
    return (
        <TouchableOpacity onPress={onPress}>
            <View className={`flex-row items-center justify-between px-6 py-4 ${isSelected ? "bg-secondary" : ""}`}>
                <View className="flex-row items-center gap-3">
                    <View className="w-14 h-14 rounded-full bg-secondary overflow-hidden">
                        <Image 
                            source={{ uri: image }}
                            className="w-14 h-14 rounded-full"
                        />
                    </View>

                    <View className="">
                        <Text className="text-lg font-semibold text-black mb-1">{name}</Text>
                        <Text className=" text-base text-foreground">{tokenPrice}</Text>
                    </View>
                </View>
                <View className="">
                    <Text className="text-right text-lg font-semibold text-black mb-1">{tokenBalance} {symbol}</Text>
                    <Text className="text-right text-base text-foreground">{balanceValue}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default TokenDropdown;