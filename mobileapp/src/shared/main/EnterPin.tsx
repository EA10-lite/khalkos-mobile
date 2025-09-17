import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface EnterPinProps {
    title?: string;
    onPinComplete?: (pin: string) => void;
    onSwap?: () => void;
    maxLength?: number;
}

const EnterPin = ({ 
    title = "Swap", 
    onPinComplete, 
    onSwap,
    maxLength = 4
}: EnterPinProps) => {
    const [pin, setPin] = useState("");

    const handleNumberPress = (number: string) => {
        if (pin.length < maxLength) {
            const newPin = pin + number;
            setPin(newPin);
            if (newPin.length === maxLength && onPinComplete) {
                onPinComplete(newPin);
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleBiometric = () => {
        // Handle biometric authentication
        console.log("Biometric authentication");
    };

    const renderPinDots = () => {
        return (
            <View className="flex-row justify-center mb-12 space-x-4">
                {Array.from({ length: maxLength }).map((_, index) => (
                    <View
                        key={index}
                        className={`w-4 h-4 rounded-full border-2 ${
                            index < pin.length
                                ? "bg-blue-500 border-blue-500"
                                : "bg-transparent border-gray-300"
                        }`}
                    />
                ))}
            </View>
        );
    };

    const KeypadButton = ({ 
        children, 
        onPress, 
        className = "" 
    }: { 
        children: React.ReactNode; 
        onPress: () => void; 
        className?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`w-20 h-20 rounded-full justify-center items-center active:bg-gray-100 ${className}`}
            activeOpacity={0.7}
        >
            {children}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 justify-center px-8">
            {/* Keypad */}
            <View className="mb-8">
                {/* Row 1: 1, 2, 3 */}
                <View className="flex-row justify-between mb-4">
                    <KeypadButton onPress={() => handleNumberPress("1")}>
                        <Text className="text-3xl font-bold text-gray-800">1</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("2")}>
                        <Text className="text-3xl font-bold text-gray-800">2</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("3")}>
                        <Text className="text-3xl font-bold text-gray-800">3</Text>
                    </KeypadButton>
                </View>

                {/* Row 2: 4, 5, 6 */}
                <View className="flex-row justify-between mb-4">
                    <KeypadButton onPress={() => handleNumberPress("4")}>
                        <Text className="text-3xl font-bold text-gray-800">4</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("5")}>
                        <Text className="text-3xl font-bold text-gray-800">5</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("6")}>
                        <Text className="text-3xl font-bold text-gray-800">6</Text>
                    </KeypadButton>
                </View>

                {/* Row 3: 7, 8, 9 */}
                <View className="flex-row justify-between mb-4">
                    <KeypadButton onPress={() => handleNumberPress("7")}>
                        <Text className="text-3xl font-bold text-gray-800">7</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("8")}>
                        <Text className="text-3xl font-bold text-gray-800">8</Text>
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("9")}>
                        <Text className="text-3xl font-bold text-gray-800">9</Text>
                    </KeypadButton>
                </View>

                {/* Row 4: Biometric, 0, Backspace */}
                <View className="flex-row justify-between mb-4">
                    <KeypadButton onPress={handleBiometric}>
                        <MaterialCommunityIcons name="fingerprint" size={24} color="black" />
                    </KeypadButton>
                    <KeypadButton onPress={() => handleNumberPress("0")}>
                        <Text className="text-3xl font-bold text-gray-800">0</Text>
                    </KeypadButton>
                    <KeypadButton onPress={handleBackspace}>
                        <View className="">
                            <MaterialCommunityIcons name="backspace-outline" size={24} color="black" />
                        </View>
                    </KeypadButton>
                </View>
            </View>

            {/* Swap Button */}
            <TouchableOpacity
                onPress={onSwap}
                className="bg-gray-900 rounded-2xl py-4 mx-4"
                activeOpacity={0.8}
                disabled={pin.length !== maxLength}
                style={{
                    opacity: pin.length !== maxLength ? 0.5 : 1
                }}
            >
                <Text className="text-white text-lg font-semibold text-center">
                    {title}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default EnterPin;