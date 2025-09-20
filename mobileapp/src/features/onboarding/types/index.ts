/**
 * Onboarding feature type definitions
 */

export type OnboardingStepProps = {
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
