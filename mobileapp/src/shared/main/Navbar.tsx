

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountModal, AvatarModal } from "../modals";
import Avatar from "./Avatar";

const Navbar = () => {
    const insets = useSafeAreaInsets();

    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
    
    return (
        <>
            <View 
                className="flex-row items-center justify-between px-6 pb-2"
                style={{ paddingTop: insets.top }}
            >
                <Avatar 
                    name="Emmanuel Chris" 
                    handlePress={() => setIsAvatarModalOpen(true)} 
                />

                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => setIsAccountModalOpen(true)}>
                        <MaterialCommunityIcons name="dots-horizontal" size={24} color={"#71717A"} />
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="line-scan" size={24} color={"#71717A"} />
                </View>
            </View>


            <AvatarModal 
                isOpen={isAvatarModalOpen} 
                closeModal={() => setIsAvatarModalOpen(false)} 
            />

            <AccountModal 
                isOpen={isAccountModalOpen} 
                closeModal={() => setIsAccountModalOpen(false)} 
            />
        </>
    )
}

export default Navbar;