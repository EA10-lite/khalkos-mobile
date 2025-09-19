/**
 * Onboarding feature type definitions
 */

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  hasSeenOnboarding: boolean;
}

export interface OnboardingStep {
  title: string;
  description: string;
  illustration?: string;
}
