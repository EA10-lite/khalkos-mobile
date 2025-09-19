import { Stack } from "expo-router";

const AuthLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="pin-setup" />
            <Stack.Screen name="wallet-unlock" />
        </Stack>
    );
};

export default AuthLayout;
