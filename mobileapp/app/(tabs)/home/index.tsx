import { Navbar } from "@/src/shared/main";
import { Foundation, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

import ChartArrow from "@/assets/images/arrow.svg";
import Receive from "@/assets/images/receive.svg";
import Save from "@/assets/images/save.svg";
import Send from "@/assets/images/send.svg";
import Swap from "@/assets/images/swap.svg";
import { ReceiveModal, SendModal, SwapModal } from "@/src/screens/home/components";
import { useState } from "react";


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

const Home = () => {
    const [activeTab, setActiveTab] = useState<string>("assets");
    const [showPromoBanner, setShowPromoBanner] = useState<boolean>(true);

    const [isSendModalVisible, setIsSendModalVisible] = useState<boolean>(false);
    const [isSwapModalVisible, setIsSwapModalVisible] = useState<boolean>(false);
    const [isReceiveModalVisible, setIsReceiveModalVisible] = useState<boolean>(false);

    const CTAS = [
        {
            title: "Receive",
            onPress: () => setIsReceiveModalVisible(true),
            icon: <Receive />,
        },
        {
            title: "Send",
            onPress: () => setIsSendModalVisible(true),
            icon: <Send />,
        },
        {
            title: "Swap",
            onPress: () => setIsSwapModalVisible(true),
            icon: <Swap />,
        },
        {
            title: "Save",
            onPress: () => {},
            icon: <Save />,
        },
    ]



    return (
        <View className="w-full h-full">
            <View className="bg-white pb-6 rounded-br-[16px] rounded-bl-[16px] mb-4">
                <Navbar />

                <View className="px-6">
                    <View className="my-8">
                        <View className="flex-row items-start gap-1 mb-1">
                            <Foundation name="dollar" size={24} color={"#A1A1AA"} />
                            <Text className="text-4xl font-bold text-black">45,000</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <ChartArrow />
                            <Foundation name="dollar" size={20} color={"#A1A1AA"} />
                            <Text className="text-lg font-semibold text-[#A1A1AA]">0.00</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        {CTAS.map((cta) => (
                            <CTA 
                                title={cta.title} 
                                icon={cta.icon} 
                                onPress={cta.onPress} 
                                key={cta.title} 
                            />
                        ))}
                    </View>
                </View>
            </View>

            {/* Promotional Banner */}
            {showPromoBanner && (
                <View className="mx-6 mb-4 hidden">
                    <View className="bg-gradient-to-r from-purple-400 to-pink-400 p-4 rounded-[16px] relative">
                        <TouchableOpacity 
                            className="absolute top-3 right-3 z-10"
                            onPress={() => setShowPromoBanner(false)}
                        >
                            <MaterialCommunityIcons name="close" size={20} color={"#FFFFFF"} />
                        </TouchableOpacity>
                        
                        <View className="flex-row items-center gap-3 pr-8">
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                                <MaterialCommunityIcons name="gift" size={24} color={"#FFFFFF"} />
                            </View>
                            
                            <View className="flex-1">
                                <Text className="text-white text-base font-medium mb-1">
                                    Set your savings % and yield more rewards
                                </Text>
                                <TouchableOpacity className="flex-row items-center gap-1">
                                    <Text className="text-white text-sm font-semibold">Get started</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color={"#FFFFFF"} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            <View className="bg-white p-6 grow rounded-tr-[16px] rounded-tl-[16px]">
                <View className="flex-row items-center gap-4 mb-8">
                    <TouchableOpacity 
                        className={`flex-row items-center gap-2 ${activeTab === "assets" ? "text-black" : "text-foreground"}`}
                        onPress={() => setActiveTab("assets")}
                    >
                        <Text className={`text-base font-semibold ${activeTab === "assets" ? "text-black" : "text-foreground"}`}>Assets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className={`flex-row items-center gap-2 ${activeTab === "savings" ? "text-black" : "text-foreground"}`}
                        onPress={() => setActiveTab("savings")}
                    >
                        <Text className={`text-base font-semibold ${activeTab === "savings" ? "text-black" : "text-foreground"}`}>Savings</Text>
                    </TouchableOpacity>
                </View>


                {activeTab === "assets" && (
                    <View className="gap-6">
                        {TOKENS.map((token) => (
                            <Tokens 
                                key={token.name} 
                                {...token} 
                            />
                        ))}
                    </View>
                )}
            </View>


            <SendModal 
                isVisible={isSendModalVisible} 
                onClose={() => setIsSendModalVisible(false)} 
            />
            <ReceiveModal 
                isOpen={isReceiveModalVisible} 
                closeModal={() => setIsReceiveModalVisible(false)} 
                token={TOKENS[0]}
            />
            <SwapModal 
                isVisible={isSwapModalVisible} 
                onClose={() => setIsSwapModalVisible(false)} 
            />
        </View>
    )
}

type CTAProps = {
    title: string;
    icon: React.ReactNode;
    onPress: () => void;
}

const CTA = ({ title, icon, onPress }: CTAProps) => {
    return (
        <TouchableOpacity className="border-[2px] border-secondary items-center justify-center gap-2 p-4.5 py-4 rounded-[16px] w-24 h-24" onPress={onPress}>
            {icon}
            <Text className="text-sm font-semibold text-black">{title}</Text>
        </TouchableOpacity>
    )
}


type TokenProps = {
    image: string;
    name: string;
    tokenPrice: string;
    symbol: string;
    tokenBalance: string;
    balanceValue: string;
}

const Tokens = ({ image, name, tokenPrice, symbol, tokenBalance, balanceValue }: TokenProps) => {
    return (
        <View className="flex-row items-center justify-between">
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
    )
}

export default Home;