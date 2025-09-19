import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";

import { useState } from "react";

interface AppearanceModalProps {
    isOpen: boolean;
    closeModal: () => void;
}


const APPEARANCE_ITEMS = [
    {
        title: "System",
        icon: "sun",
    },
    {
        title: "Light",
        icon: "sun",
    },
    {
        title: "Dark",
        icon: "moon",
    }
]

const AppearanceModal = ({ isOpen, closeModal }: AppearanceModalProps) => {
    const [appearance, setAppearance] = useState<string>("system");

    return (
        <Modal isVisible={isOpen} onBackdropPress={closeModal}>
            <View className="bg-white px-6 py-8 rounded-[28px] absolute bottom-0 w-full left-0 right-0">
                <View className="flex-row items-center justify-between gap-2 mb-4">
                    <Text className="text-black font-[600] text-2xl">Appearance</Text>

                    <TouchableOpacity 
                        onPress={closeModal}
                    >
                        <MaterialIcons name="close" size={24} color="black" className="ml-[8px]" />
                    </TouchableOpacity>
                </View>


                <View className="bg-[#18181B05] rounded-[16px] p-4">
                    <View className="flex-row items-center justify-between gap-4">
                        {APPEARANCE_ITEMS.map((item) => (
                            <AppearanceItem 
                                key={item.title}
                                {...item}
                                icon={item.icon}
                                isActive={appearance.toLowerCase() === item.title.toLowerCase()}
                                onPress={() => setAppearance(item.title)}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

type AppearanceItemProps = {
    icon: "sun" | "moon",
    title: string;
    onPress?: () => void;
    isActive: boolean;
}

const AppearanceItem = ({ icon, title, onPress, isActive }: AppearanceItemProps) => {
    return (
        <Pressable onPress={onPress}>
            <View className={"justify-between bg-white w-28 h-28 rounded-[16px] px-4 py-4 " + (isActive ? "border-2 border-primary" : "")}>
                <View className="">
                    <AntDesign name={icon} size={24} color={isActive ? "black" : "#A1A1AA"} />
                </View>
                <Text className={"font-[600] text-sm " + (isActive ? "text-black" : "text-[#A1A1AA]")}>{title}</Text>
            </View>
        </Pressable>
    );
};


export default AppearanceModal; 