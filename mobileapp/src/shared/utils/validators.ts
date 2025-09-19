/**
 * Validation utility functions
 * Pure functions for data validation
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate PIN format (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  const pinRegex = /^\d{4,6}$/;
  return pinRegex.test(pin);
}

/**
 * Validate Starknet address
 */
export function isValidStarknetAddress(address: string): boolean {
  // Basic validation for Starknet address format
  const starknetRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return starknetRegex.test(address);
}

/**
 * Validate amount (positive number with up to 18 decimals)
 */
export function isValidAmount(amount: string): boolean {
  const amountRegex = /^\d+(\.\d{1,18})?$/;
  const numAmount = parseFloat(amount);
  return amountRegex.test(amount) && numAmount > 0;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters required');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  return {
    isValid: score >= 3,
    score,
    feedback,
  };
}
