import { Entypo } from "@expo/vector-icons";
import { Tabs } from "expo-router";


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