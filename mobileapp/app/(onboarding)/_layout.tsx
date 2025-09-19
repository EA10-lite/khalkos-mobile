import { Stack } from "expo-router";

const OnboardingLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="get-started" />
        </Stack>
    );
};

export default OnboardingLayout;
