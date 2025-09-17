import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { Button } from "../main/";

import Avatar1 from "@/assets/images/Avatar.svg";
import Avatar2 from "@/assets/images/Avatar2.svg";
import Avatar3 from "@/assets/images/Avatar3.svg";
import Avatar4 from "@/assets/images/Avatar4.svg";
import Avatar5 from "@/assets/images/Avatar5.svg";
import Avatar6 from "@/assets/images/Avatar6.svg";
import Avatar7 from "@/assets/images/Avatar7.svg";
import Avatar8 from "@/assets/images/Avatar8.svg";

type ModalDTO = {
    isOpen:     boolean;
    closeModal: () => void;
}


const AVATARS = [
    {
        id: "1",
        isGradient: false,
        bg: ["#BFDBFE"],
        avatar: <Avatar1 />,
    },
    {
        id: "2",
        isGradient: true,
        bg: ["#F9742C", "#F20486"],
        avatar: <Avatar2 />,
    },
    {
        id: "3",
        isGradient: true,
        bg: ["#CD4FF2", "#5F4AFF"],
        avatar: <Avatar3 />,
    },
    {
        id: "4",
        isGradient: true,
        bg: ["#FF39DF", "#FAA0A0"],
        avatar: <Avatar4 />,
    },
    {
        id: "5",
        isGradient: true,
        bg: ["#4F86F2", "#FF4A80"],
        avatar: <Avatar5 />,
    },
    {
        id: "6",
        isGradient: true,
        bg: ["#AC51AE", "#FB4040"],
        avatar: <Avatar6 />,
    },
    {
        id: "7",
        isGradient: true,
        bg: ["#755BDF", "#2C1FA3"],
        avatar: <Avatar7 />,
    },
    {
        id: "8",
        isGradient: true,
        bg: ["#00FFC2", "#01D83D"],
        avatar: <Avatar8 />,
    },
]

const AvatarModal = ({ isOpen, closeModal } : ModalDTO) => {
    return (
        <Modal 
            isVisible={isOpen}
            onBackdropPress={closeModal}
            style={{ margin: 0, paddingHorizontal: 8}}
        >
            <View className="bg-white px-4 py-8 rounded-[28px] absolute bottom-[32px] w-full left-[10px] right-[10px]">
                <View className="flex-row items-center justify-between gap-2 mb-4">
                    <Text className="text-black font-[600] text-2xl">Choose Avatar</Text>

                    <TouchableOpacity 
                        onPress={closeModal}
                    >
                        <MaterialIcons name="close" size={24} color="black" className="ml-[8px]" />
                    </TouchableOpacity>
                </View>

                <View className="modal-body flex-row justify-between flex-wrap gap-4 my-4">
                    {AVATARS.map(avatar => (
                        <AvatarItem 
                            key={avatar.id} 
                            {...avatar} 
                        />
                    ))}
                </View>


                <View className="modal-footer">
                    <Button 
                        title="Save"
                        onPress={closeModal}
                    />
                </View>
            </View>
        </Modal>
    )
}


type AvatarItemProps = {
    id: string;
    isGradient: boolean;
    bg: string[];
    avatar: React.ReactNode;
}

const AvatarItem = ({ id, isGradient, bg, avatar }: AvatarItemProps) => {
    if (!isGradient) {
        return (
            <View 
                className={`items-center justify-center gap-2 mb-4 w-24 h-24 rounded-full`}
                style={{ backgroundColor: bg[0] }}
            >
                {avatar}
            </View>
        )
    }

    return (
        <View className="w-24 h-24">
            <LinearGradient
                colors={[bg[0], bg[1]]}
                style={{ width: "100%", height: "100%", borderRadius: "100%"}}
            >
                <View className="w-full h-full rounded-full items-center justify-center">
                    {avatar}
                </View>
            </LinearGradient>
        </View>
    )
}


export default AvatarModal;