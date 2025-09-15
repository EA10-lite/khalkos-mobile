import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Stargrey from "@/assets/images/star-grey.svg";
import Star from "@/assets/images/star.svg";
import Wallet from "@/assets/images/wallet-big.svg";
import WalletSmall from "@/assets/images/wallet-small.svg";
import { Button } from "@/src/shared";

const GetStarted = () => {
    const insets = useSafeAreaInsets();

    return (
        <View 
            className="w-full h-full bg-white p-6"
            style={{ 
                paddingBottom: insets.bottom,
                paddingTop: insets.top,
            }}
        >
            <View className="mt-12 grow">
                <View className="max-w-[200px] mx-auto mb-12">
                    <Text className="text-2xl font-bold text-black text-center">
                        <Text className="text-purple">Sweet!</Text> Your new wallet is ready!
                    </Text>
                </View>

                <View className="items-center justify-center">
                    <View className="w-full flex-row items-center justify-between px-6">
                        <Stargrey />
                        <Star />
                    </View>

                    <Wallet />
                </View>
            </View>



            <View className="">
                <Text className="text-2xl font-bold text-black text-center mb-4">Let's get started</Text>

                <View className="flex-row items-center gap-3 bg-[#18181B05] py-4 px-6 rounded-xl mb-8">
                    <View className="">
                        <WalletSmall />
                    </View>

                    <View>
                        <Text className="text-lg font-semibold text-black">Start saving</Text>
                        <Text className="text-sm text-foreground font-medium">Give your savings a purpose</Text>
                    </View>
                </View>

                <Button 
                    title="View wallet"
                    onPress={() => {}}
                />
            </View>
        </View>
    )
}

export default GetStarted;