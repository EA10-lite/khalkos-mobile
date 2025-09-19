import { View } from "react-native";

interface CustomModalProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const CustomModal = ({ isVisible, onClose, children }: CustomModalProps) => {
    return (
      <View></View>
    );
};