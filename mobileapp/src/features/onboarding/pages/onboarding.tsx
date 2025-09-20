import Illustration from '@/assets/images/illustration.svg';
import { useAuth } from '@/src/features/auth/providers/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingStep from '../components/OnboardingStep';
import { ONBOARDING } from '../data';


const Onboarding = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    if (step < ONBOARDING.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      await signIn();
      await AsyncStorage.setItem("isOnboarded", "true");

      showMessage({
        message: 'Wallet Initialized!',
        description: `Your wallet has been initialized successfully!`,
        type: 'success',
        duration: 3000,
      });

      setTimeout(() => {
        router.push('/(onboarding)/get-started' as any);
      }, 1500);
    } catch (error: any) {
      console.log('error', error);
      showMessage({
        message: 'Sign-in Failed',
        description:
          error.message || 'Failed to create wallet. Please try again.',
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 items-center justify-between bg-secondary">
        <View className="grow items-center justify-center">
          <Illustration />
        </View>

        <View className="w-full px-4" style={{ paddingBottom: insets.bottom }}>
          <OnboardingStep
            title={ONBOARDING[step].title}
            description={ONBOARDING[step].description}
            step={step + 1}
            totalSteps={ONBOARDING.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLastStep={step === ONBOARDING.length - 1}
            onGetStarted={handleGoogleSignIn}
            loading={loading}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

export default Onboarding;
