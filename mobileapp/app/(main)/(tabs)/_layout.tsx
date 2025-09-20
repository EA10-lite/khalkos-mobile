import ChatIcon from "@/assets/images/icons/chat.svg";
import HistoryIcon from "@/assets/images/icons/history.svg";
import SendIcon from "@/assets/images/icons/send.svg";
import SwapIcon from "@/assets/images/icons/swap.svg";
import WalletIcon from "@/assets/images/icons/wallet.svg";
import { Tabs } from "expo-router";


const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#000",
                tabBarInactiveTintColor: "#71717A",
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#F4F4F5",
                    paddingTop: 8,
                    paddingBottom: 10,
                    height: 80,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginBottom: 0,
                },
            }}
            initialRouteName="home"
        >
            <Tabs.Screen 
                name="home" 
                options={{
                    title: "Wallet",
                    tabBarIcon: ({ color }) => (
                        <WalletIcon width={24} height={24} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="send" 
                options={{
                    title: "Send",
                    tabBarIcon: ({ color }) => (
                        <SendIcon width={24} height={24} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="swap" 
                options={{
                    title: "Swap",
                    tabBarIcon: ({ color }) => (
                        <SwapIcon width={24} height={24} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="chat" 
                options={{
                    title: "AI Chat",
                    tabBarIcon: ({ color }) => (
                        <ChatIcon width={24} height={24} color={color} />
                    ),
                }} 
            />
            <Tabs.Screen 
                name="history" 
                options={{
                    title: "History",
                    tabBarIcon: ({ color }) => (
                        <HistoryIcon width={24} height={24} color={color} />
                    ),
                }} 
            />
        </Tabs>
    )
}

export default TabLayout;