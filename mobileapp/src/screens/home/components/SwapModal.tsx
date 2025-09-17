import { Token } from "@/src/interfaces/token";
import { EnterPin } from "@/src/shared/main";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TokenDropdown from "./TokenDropdown";

const TOKENS = [
    {
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1747033579",
        name: "Bitcoin",
        tokenPrice: "$100,000",
        symbol: "BTC",
        tokenBalance: "0.01",
        balanceValue: "$100",
    },
    {
        address: "0x0000000000000000000000000000000000000000",
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1747033532",
        name: "Ethereum",
        tokenPrice: "$1,000",
        symbol: "ETH",
        tokenBalance: "0.02",
        balanceValue: "$200",
    },
    {
        address: "0x0000000000000000000000000000000000000000",
        image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194",
        name: "USD Coin",
        tokenPrice: "$1",
        symbol: "USDC",
        tokenBalance: "10",
        balanceValue: "$10",
    },
]




interface SwapModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const SwapModal = ({ isVisible, onClose }: SwapModalProps) => {
    const insets = useSafeAreaInsets();
    const [transactionType, setTransactionType] = useState<string>("normal");
    const [fromToken, setFromToken] = useState<Token>(TOKENS[0])
    const [toToken, setToToken] = useState<Token | null>(null)

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
                <View className="flex-row items-center justify-between mb-6">
                    <Text className="text-2xl font-bold text-black">Swap</Text>
                    <TouchableOpacity 
                        onPress={onClose}
                        className="rounded-full bg-[#18181B14] w-8 h-8 items-center justify-center"
                    >
                        <Ionicons name="close" size={20} color={"#A1A1AA"} />
                    </TouchableOpacity>
                </View>

                <SwapForm 
                    selectedToken={fromToken}
                    setSelectedToken={setFromToken}
                    toToken={toToken}
                    setToToken={setToToken}
                />

                <TransactionProcess 
                    transactionType={transactionType}
                    selectedToken={fromToken}
                    setTransactionType={setTransactionType}
                />


                <EnterPin />
            </View>
        </Modal>
    )
}

type SwapFormProps = {
    selectedToken: Token;
    setSelectedToken: (token: Token) => void;
    toToken: Token | null;
    setToToken: (token: Token) => void;
}

const SwapForm = ({selectedToken, setSelectedToken, toToken, setToToken}: SwapFormProps) => {
    const [openTokenDropdown, setOpenTokenDropdown] = useState<boolean>(false);
    const [dropdownType, setDropdownType] = useState<"from" | "to">("from");


    const handleTokenDropdownClick = (type: "from" | "to") => {
        setDropdownType(type);
        setOpenTokenDropdown(true);
    }

    return (
        <>
            <View className="bg-[#18181B0A] rounded-[16px] p-2">
                <View className="flex-row items-center justify-between bg-white shadow-sm p-4 rounded-[16px] mb-2">
                    <View className="flex-row items-center gap-2">
                        <View className="w-14 h-14 rounded-full bg-secondary overflow-hidden">
                            <Image 
                                source={{ uri: selectedToken.image }}
                                className="w-14 h-14 rounded-full"
                            />
                        </View>

                        <View className="">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-lg font-semibold text-black">
                                    {selectedToken.name}
                                </Text>
                                <TouchableOpacity onPress={() => handleTokenDropdownClick("from")}>
                                    <MaterialIcons name="arrow-drop-down" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                            <Text className=" text-base text-foreground">
                                Balance: 
                                <Text className="text-primary">{selectedToken.tokenBalance}</Text>
                            </Text>
                        </View>
                    </View>

                    <View className="justify-end">
                        <View className="mb-2 flex-row items-center gap-2">
                            <TouchableOpacity
                                className="bg-[##D6F2FE] px-2 py-1 rounded-[8px] flex-row items-center gap-2"
                            >
                                <SimpleLineIcons name="magic-wand" size={12} color="#28A4D9" />
                                <Text className="text-xs font-semibold text-primary">MAX</Text>
                            </TouchableOpacity>

                            <TextInput 
                                placeholder="0"
                                className="text-black text-xl font-bold"
                            />
                        </View>

                        <Text className="text-sm font-semibold text-[#A1A1AA] text-right">$0.00</Text>
                    </View>
                </View>

                <View className="mt-[-24px] left-[50%] z-50 ml-[-24px]">
                    <View className="bg-white w-10 h-10 rounded-full items-center justify-center shadow-sm border border-[#eee]">
                        <MaterialCommunityIcons name="swap-vertical" size={24} color="#3B82F6" />
                    </View>
                </View>


                <View className="mt-[-12px]">
                    {!toToken ?(
                        <View className="p-4 justify-end flex-row">
                            <View className="flex-row items-center gap-2">

                                <TouchableOpacity
                                    className="bg-primary px-4 py-2.5 rounded-[35px] flex-row items-center gap-2"
                                    onPress={() => handleTokenDropdownClick("to")}
                                >
                                    <Text className="text-white text-sm font-semibold">Choose token</Text>
                                    <MaterialIcons name="arrow-forward-ios" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="bg-white shadow-sm p-4 rounded-[16px] flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <View className="w-14 h-14 rounded-full bg-secondary overflow-hidden">
                                    <Image 
                                        source={{ uri: toToken.image }}
                                        className="w-14 h-14 rounded-full"
                                    />
                                </View>

                                <View className="">
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-lg font-semibold text-black">
                                            {toToken.name}
                                        </Text>
                                    </View>
                                    <Text className=" text-base text-foreground">
                                        Balance: 
                                        <Text className="text-primary">{toToken.tokenBalance}</Text>
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                className="bg-primary px-4 py-2.5 rounded-[35px] flex-row items-center gap-2"
                                onPress={() => handleTokenDropdownClick("to")}
                            >
                                <Text className="text-white text-sm font-semibold">Change</Text>
                                <MaterialIcons name="arrow-forward-ios" size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>


            <TokenDropdown 
                isOpen={openTokenDropdown} 
                closeModal={() => setOpenTokenDropdown(false)} 
                tokens={TOKENS}
                selectedToken={dropdownType === "from" ? selectedToken.name : toToken?.name || ""}
                setSelectedToken={(token: Token) => dropdownType === "from" ? setSelectedToken(token) : setToToken(token)}
            />
        </>
    )
}


type TransactionProcessProps = {
    transactionType: string;
    selectedToken: Token;
    setTransactionType: (type: string) => void;
}

const TransactionProcess = ({transactionType, selectedToken, setTransactionType} : TransactionProcessProps) => {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    return (
        <>
            <View className="flex-row items-center justify-between bg-[#18181B0A] rounded-[16px] p-4 mt-8">
                <View>
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
                            <Image 
                                source={{ uri: selectedToken.image }}
                                className="w-6 h-6 rounded-full"
                            />
                        </View>
                        <Text className="text-base font-medium text-black">Loading...</Text>
                    </View>

                    <Text className="text-xs font-medium text-black">Estimated Fee</Text>
                </View>
                <TouchableOpacity 
                    className="flex-row items-center gap-2 bg-white rounded-[16px] px-4 py-1 border border-[#ddd]"
                    onPress={() => setIsVisible(true)}
                >
                    <Text className="text-sm font-semibold text-black capitalize">{transactionType}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={18} color="black" />
                </TouchableOpacity>
            </View>

            <TransactionType 
                isVisible={isVisible} 
                closeModal={() => setIsVisible(false)} 
                selectedTransactionType={transactionType}
                setTransactionType={(type: string)=> {
                    setTransactionType(type)
                    setIsVisible(false)
                }}
            />
        </>
    )
}

type TransactionTypeProps = {
    isVisible: boolean;
    closeModal: () => void;
    selectedTransactionType: string;
    setTransactionType: (type: string) => void;
}

const TransactionType = ({isVisible, closeModal, selectedTransactionType, setTransactionType} : TransactionTypeProps) => {
    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            transparent={true}
            animationType="fade"
            style={{ margin: 0 }}

        >
            <View className="modal-overlay items-center justify-center h-full w-full bg-[#000000a0]">
                <View className="modal-content w-[95%] bg-white border-ash rounded-lg">
                    <View className="flex-row items-center justify-between border-b border-[#eee] p-4">
                        <Text className="text-lg font-semibold text-black">Transaction Type</Text>


                        <TouchableOpacity onPress={closeModal}>
                            <Ionicons name="close" size={20} color={"black"} />
                        </TouchableOpacity>
                    </View>


                    <View className="gap-4 p-4">
                        {["normal", "fast", "very fast"].map((type) => (
                            <TransactionSpeed 
                                key={type}
                                type={type}
                                selectedTransactionType={selectedTransactionType}
                                setTransactionType={(type: string)=> {
                                    setTransactionType(type)
                                    closeModal()
                                }}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

type TransactionSpeedProps = {
    type: string;
    selectedTransactionType: string;
    setTransactionType: (type: string) => void;
}


const TransactionSpeed = ({type, selectedTransactionType, setTransactionType} : TransactionSpeedProps) => {
    return (
        <TouchableOpacity 
            className="flex-row items-center justify-between gap-2" 
            onPress={() => setTransactionType(type)}
        >
            <Text className="text-base font-semibold text-black">{type}</Text>

            <View className="w-4 h-4 rounded-full border border-primary items-center justify-center">
                {selectedTransactionType === type &&<View className="w-2 h-2 rounded-full bg-primary" />}
            </View>
        </TouchableOpacity>
    )
}


export default SwapModal;