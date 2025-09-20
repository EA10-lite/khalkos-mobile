import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SavingsModalProps {
    isOpen: boolean;
    closeModal: () => void;
    onSavingsPercentageSet: (percentage: number) => void;
    currentPercentage?: number;
}

const SavingsModal = ({ isOpen, closeModal, onSavingsPercentageSet, currentPercentage }: SavingsModalProps) => {
    const insets = useSafeAreaInsets();
    const [percentage, setPercentage] = useState<string>(currentPercentage?.toString() || '');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (currentPercentage !== undefined) {
            setPercentage(currentPercentage.toString());
        }
    }, [currentPercentage]);

    const handleSavePercentage = async () => {
        const numPercentage = parseFloat(percentage);
        
        // Validation
        if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
            Alert.alert('Invalid Percentage', 'Please enter a valid percentage between 0 and 100.');
            return;
        }

        setIsLoading(true);
        try {
            // Save to secure storage
            await SecureStore.setItemAsync('savingsPercentage', numPercentage.toString());
            onSavingsPercentageSet(numPercentage);
            closeModal();
        } catch (error) {
            console.error('Error saving savings percentage:', error);
            Alert.alert('Error', 'Failed to save savings percentage. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPercentage(currentPercentage?.toString() || '');
        closeModal();
    };

    return (
        <Modal 
            isVisible={isOpen}
            onBackdropPress={handleClose}
            style={{ margin: 0, justifyContent: 'flex-end' }}
            animationIn="slideInUp"
            animationOut="slideOutDown"
        >
            <View 
                className="bg-white px-6 py-6 rounded-t-[28px]"
                style={{ paddingBottom: insets.bottom + 24 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <Text className="text-lg font-semibold text-black">
                        {currentPercentage !== undefined ? 'Edit Savings %' : 'Set Savings %'}
                    </Text>

                    <View style={{ width: 24 }} />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-base text-gray-700 mb-2">
                        Set the percentage of your income you want to automatically save
                    </Text>
                    <Text className="text-sm text-gray-500">
                        This will help you build your savings consistently and earn rewards
                    </Text>
                </View>

                {/* Percentage Input */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                        Savings Percentage
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <TextInput
                            className="flex-1 text-lg font-medium text-black"
                            value={percentage}
                            onChangeText={setPercentage}
                            placeholder="0"
                            keyboardType="numeric"
                            maxLength={5}
                        />
                        <Text className="text-lg font-medium text-gray-500 ml-2">%</Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                        Enter a value between 0 and 100
                    </Text>
                </View>

                {/* Percentage Suggestions */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-3">
                        Quick Select
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {[5, 10, 15, 20, 25, 30].map((suggestedPercentage) => (
                            <TouchableOpacity
                                key={suggestedPercentage}
                                className={`px-4 py-2 rounded-full border ${
                                    percentage === suggestedPercentage.toString()
                                        ? 'bg-primary border-primary'
                                        : 'bg-white border-gray-200'
                                }`}
                                onPress={() => setPercentage(suggestedPercentage.toString())}
                            >
                                <Text className={`text-sm font-medium ${
                                    percentage === suggestedPercentage.toString()
                                        ? 'text-white'
                                        : 'text-gray-700'
                                }`}>
                                    {suggestedPercentage}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Benefits */}
                <View className="bg-green-50 p-4 rounded-xl mb-6">
                    <View className="flex-row items-center mb-2">
                        <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
                        <Text className="text-sm font-medium text-green-800 ml-2">
                            Benefits of Saving
                        </Text>
                    </View>
                    <Text className="text-sm text-green-700">
                        • Earn additional rewards on your savings
                    </Text>
                    <Text className="text-sm text-green-700">
                        • Build wealth automatically
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    className={`p-4 rounded-xl ${
                        isLoading || !percentage ? 'bg-gray-300' : 'bg-primary'
                    }`}
                    onPress={handleSavePercentage}
                    disabled={isLoading || !percentage}
                >
                    <Text className="text-center text-white text-base font-semibold">
                        {isLoading ? 'Saving...' : currentPercentage !== undefined ? 'Update Percentage' : 'Set Percentage'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default SavingsModal;
