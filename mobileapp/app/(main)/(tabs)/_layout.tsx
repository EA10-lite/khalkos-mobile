import { Tabs } from "expo-router";
import ChatIcon from "@/assets/images/icons/chat.svg";
import SendIcon from "@/assets/images/icons/send.svg";
import SwapIcon from "@/assets/images/icons/swap.svg";
import UserIcon from "@/assets/images/icons/user.svg";
import WalletIcon from "@/assets/images/icons/wallet.svg";


const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#71717A",
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                },
                tabBarLabelPosition: "beside-icon",
                tabBarIconStyle: {
                    marginBottom: 4,
                },
            }}
            initialRouteName="home"
        >
            <Tabs.Screen 
                name="home" 
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Entypo name="wallet" size={24} color={color} />
                    ),
                }} 
            />
        </Tabs>
    )
}

export default TabLayout;