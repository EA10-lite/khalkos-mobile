import Illustration from '@/assets/images/illustration.svg';
import { useAuth } from '@/src/features/auth/providers/auth';
import { StarknetWalletManager } from '@/src/features/wallet';
import { Button } from '@/src/shared/components';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
    GestureHandlerRootView,
    PanGestureHandler,
    State,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING = [
  {
    title: 'Your spare change is going nowhere',
    description:
      'Every transaction leaves behind digital dust. What if that dust could grow?',
  },
  {
    title: 'Meet your invisible savings account',
    description:
      'Khalkos rounds up every payment and invests the spare change automatically',
  },
  {
    title: 'Watch small change become big',
    description: 'Earn 8-15% APY while you spend normally. No effort required.',
  },
];

const Onboarding = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const walletManager = StarknetWalletManager.getInstance();
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

type OnboardingStepProps = {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onGetStarted?: () => void;
  isLastStep: boolean;
  loading?: boolean;
};

const OnboardingStep = ({
  title,
  description,
  step,
  totalSteps,
  onNext,
  onPrevious,
  onGetStarted,
  isLastStep,
  loading = false,
}: OnboardingStepProps) => {
  const slideAnim = useRef(new Animated.Value(0)).current; // Start at center
  const scaleAnims = useRef(
    Array(totalSteps)
      .fill(0)
      .map(() => new Animated.Value(0.8))
  ).current;

  useEffect(() => {
    // Reset slide animation to center
    slideAnim.setValue(0);

    // Animate step indicator dots
    scaleAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === step - 1 ? 1.2 : 0.8,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [step]);

  const handleSwipeGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Provide visual feedback during swipe
      slideAnim.setValue(translationX * 0.3); // Scale down the movement for subtle effect
    } else if (state === State.END) {
      const swipeThreshold = 50; // Minimum distance for a swipe

      if (translationX > swipeThreshold && onPrevious) {
        // Swipe right - go to previous step
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          onPrevious();
          slideAnim.setValue(0);
        });
      } else if (translationX < -swipeThreshold && onNext) {
        // Swipe left - go to next step
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          onNext();
          slideAnim.setValue(0);
        });
      } else {
        // Snap back to center if swipe wasn't strong enough
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <View className="w-full rounded-[40px] bg-white px-6 py-[30px]">
      <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <Text className="mb-4 text-center font-bold text-2xl text-black">
            {title}
          </Text>
          <Text
            className="mb-6 text-center font-medium text-base text-foreground"
            style={{
              lineHeight: 20,
              letterSpacing: 0.25,
            }}
          >
            {description}
          </Text>
        </Animated.View>
      </PanGestureHandler>

      {/* Onboarding Step Indicator */}
      <View className="my-4 flex-row justify-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Animated.View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              index === step - 1 ? 'w-4 rounded-md bg-black' : 'bg-gray-300'
            }`}
            style={{
              transform: [{ scale: scaleAnims[index] }],
            }}
          />
        ))}
      </View>

      <Button
        title={isLastStep ? 'Sign in with Google' : 'Next'}
        onPress={isLastStep ? onGetStarted : onNext}
        loading={loading}
        disabled={loading}
      />

      <Text className="text-center text-xs text-foreground">
        By continuing, you accept our{' '}
        <Text className="font-bold text-black">Terms & Conditions</Text> and{' '}
        <Text className="font-bold text-black">Privacy Policy</Text>.
      </Text>
    </View>
  );
};

export default Onboarding;
