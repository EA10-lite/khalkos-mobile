import Illustration from "@/assets/images/illustration.svg";
import { Button } from "@/src/shared";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ONBOARDING = [
    {
        title: "Your spare change is going nowhere",
        description: "Every transaction leaves behind digital dust. What if that dust could grow?",
    },
    {
        title: "Meet your invisible savings account",
        description: "Khalkos rounds up every payment and invests the spare change automatically",
    },
    {
        title: "Watch small change become big money",
        description: "Earn 8-15% APY while you spend normally. No effort required.",
    },
];

const Onboarding = () => {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(0);

    const handleNext = () => {
        if (step < ONBOARDING.length - 1) {
            setStep(step + 1);
        }
    };

    const handleGetStarted = () => {
        router.push("/get-started");
    };

    return (
        <View className="flex-1 items-center justify-between bg-secondary">
            <View className="grow items-center justify-center">
                <Illustration />
            </View>

            <View
                className="w-full px-4"
                style={{ paddingBottom: insets.bottom }}
            >
                <OnboardingStep
                    title={ONBOARDING[step].title}
                    description={ONBOARDING[step].description}
                    step={step + 1}
                    totalSteps={ONBOARDING.length}
                    onNext={handleNext}
                    isLastStep={step === ONBOARDING.length - 1}
                    onGetStarted={handleGetStarted}
                />
            </View>
        </View>
    );
};

type OnboardingStepProps = {
    title: string;
    description: string;
    step: number;
    totalSteps: number;
    onNext?: () => void;
    onGetStarted?: () => void;
    isLastStep: boolean;
};

const OnboardingStep = ({
    title,
    description,
    step,
    totalSteps,
    onNext,
    onGetStarted,
    isLastStep,
}: OnboardingStepProps) => {
    const slideAnim = useRef(new Animated.Value(300)).current; // Start off-screen to the right
    const scaleAnims = useRef(
        Array(totalSteps)
            .fill(0)
            .map(() => new Animated.Value(0.8))
    ).current;

    useEffect(() => {
        // Reset slide animation
        slideAnim.setValue(300);

        // Slide in from right
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();

        // Animate step indicator dots
        scaleAnims.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: index === step - 1 ? 1.2 : 0.8,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        });

        // Slide out to left when component unmounts (step changes)
        return () => {
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 300,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start();
        };
    }, [step]);

    return (
        <Animated.View
            className="w-full bg-white rounded-[40px] px-6 py-[40px]"
            style={{ transform: [{ translateX: slideAnim }] }}
        >
            <Text className="text-2xl font-bold text-black text-center mb-4">
                {title}
            </Text>
            <Text 
                className="text-base font-medium text-foreground text-center mb-6"
                style={{
                    lineHeight: 20,
                    letterSpacing: 0.25,
                }}
            >
                {description}
            </Text>

            {/* Onboarding Step Indicator */}
            <View className="flex-row justify-center my-4">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <Animated.View
                        key={index}
                        className={`h-2 w-2 rounded-full mx-1 ${
                            index === step - 1 ? 'bg-black w-4 rounded-md' : 'bg-gray-300'
                        }`}
                        style={{
                            transform: [{ scale: scaleAnims[index] }],
                        }}
                    />
                ))}
            </View>

            <Button 
                title={isLastStep ? 'Get Started' : 'Next'}
                onPress={isLastStep ? onGetStarted : onNext}
            />

            <Text className="text-sm text-foreground text-center">
                By continuing, you accept our{" "}
                <Text className="text-black font-bold">Terms & Conditions</Text>{" "}
                and{" "}
                <Text className="text-black font-bold">Privacy Policy</Text>.
            </Text>
        </Animated.View>
    );
};

export default Onboarding;