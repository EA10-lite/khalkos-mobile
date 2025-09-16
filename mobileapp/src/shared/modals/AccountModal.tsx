import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import Avatar from "../Avatar";

import Appearance from "@/assets/images/appearance.svg";
import ChevronRight from "@/assets/images/arrow-right.svg";
import Currency from "@/assets/images/currency.svg";
import DotMenu from "@/assets/images/dot-vertical.svg";
import Notifications from "@/assets/images/notification.svg";
import Privacy from "@/assets/images/privacy.svg";


import FaceId from "@/assets/images/face-id.svg";
import KeyChain from "@/assets/images/key-chain.svg";
import Logout from "@/assets/images/logout.svg";



import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppearanceModal from "./AppearanceModal";


const PREFERENCES = [
    {
        icon: <Appearance />,
        title: "Appearance",
        description: "System",
        isDotMenu: true,
    },
    {
        icon: <Currency />,
        title: "Currency",
        description: "USD",
        isDotMenu: true,
    },
    
    {
        icon: <Notifications />,
        title: "Notifications",
    },
    
    {
        icon: <Privacy />,
        title: "Privacy",
    },
]



const SETTINGS = [
    {
        icon: <FaceId />,
        title: "Face ID",
    },
    {
        icon: <KeyChain />,
        title: "Export Private Key",
    },
    {
        icon: <Logout />,
        title: "Logout",
    },
]

interface AccountModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const AccountModal = ({ isOpen, closeModal }: AccountModalProps) => {
    const insets = useSafeAreaInsets();

    const [isAppearance, setIsAppearance] = useState<boolean>(false);



    const handlePreferencePress = (index: number) => {
        switch (index) {
            case 0:
                setIsAppearance(!isAppearance);
                break;
        }
    }
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
                <View className="">
                    <View className="header p-4 bg-gray-100 rounded-[16px] w-full h-40 justify-end mb-6">
                        <View className="flex-row items-center gap-2">
                            <Avatar 
                                name="Emmanuel Chris"
                                handlePress={() => {}}
                                size={14}
                            />

                            <View className="flex-1">
                                <Text className="text-black font-[600] text-2xl">Emmanuel Chris</Text>
                                <Text className="text-sm text-gray-500">emmanuel@gmail.com</Text>
                            </View>
                        </View>
                    </View>

                    <View className="body">
                        <View className="field mb-8">
                            <Text className="text-[#A1A1AA] font-semibold text-lg mb-4">Preferences</Text>

                            <View className="gap-8">
                                {PREFERENCES.map((preference, index) => (
                                    <AccountItem 
                                        key={preference.title}
                                        icon={preference.icon}
                                        title={preference.title}
                                        description={preference.description}
                                        isDotMenu={preference.isDotMenu}
                                        onPress={() => handlePreferencePress(index)}
                                    />
                                ))}
                            </View>
                        </View>

                        <View className="field">
                            <Text className="text-[#A1A1AA] font-semibold text-lg mb-4">Settings</Text>

                            <View className="gap-8">
                                {SETTINGS.map((preference, index) => (
                                    <AccountItem 
                                        key={preference.title}
                                        icon={preference.icon}
                                        title={preference.title}
                                        onPress={() => handlePreferencePress(index)}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </View>


                <AppearanceModal 
                    isOpen={isAppearance}
                    closeModal={() => setIsAppearance(false)}
                />
            </View>
        </Modal>
    );
};


type AccountItemProps = {
    icon: React.ReactNode;
    title: string;
    description?: string;
    onPress?: () => void;
    isDotMenu?: boolean;
}

const AccountItem = ({ icon, title, description, onPress, isDotMenu }: AccountItemProps) => {
    return (
        <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-2">
                <View className="w-8">
                    {icon}
                </View>
                <Text className="text-black font-semibold text-lg">{title}</Text>
            </View>

            <TouchableOpacity onPress={onPress} className="flex-row items-center gap-4">
                {description && <Text className="text-sm font-semibold text-[#71717A]">{description}</Text>}
                {isDotMenu ? <DotMenu /> : <ChevronRight />}
            </TouchableOpacity>
        </View>
    );
};


export default AccountModal;