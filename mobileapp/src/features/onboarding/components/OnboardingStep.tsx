import { Button } from '@/src/shared/components';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { OnboardingStepProps } from '../types';

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
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    Array(totalSteps)
      .fill(0)
      .map(() => new Animated.Value(0.8))
  ).current;

  useEffect(() => {
    slideAnim.setValue(0);

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
      slideAnim.setValue(translationX * 0.3);
    } else if (state === State.END) {
      const swipeThreshold = 50;

      if (translationX > swipeThreshold && onPrevious) {
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

export default OnboardingStep;
