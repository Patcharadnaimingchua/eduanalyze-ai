// Mirrors passwordSchema (lib/validation/common.ts) and the backend's
// identical @Matches regex exactly — these 4 are the only REQUIRED rules
// enforced anywhere in the system. Special character is intentionally
// NOT a requirement (schema/backend never checks it) — it only nudges
// the strength score upward, and the UI must never present it as
// blocking or invalid, only as a recommendation.
export interface PasswordRequirements {
  minLength: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  specialChar: boolean;
}

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export interface PasswordStrength {
  requirements: PasswordRequirements;
  /** Count of the 4 REQUIRED rules satisfied (0-4) — specialChar excluded. */
  requiredMet: number;
  level: PasswordStrengthLevel;
}

export function evaluatePasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements = evaluatePasswordRequirements(password);
  const requiredMet = [
    requirements.minLength,
    requirements.lowercase,
    requirements.uppercase,
    requirements.number,
  ].filter(Boolean).length;

  let level: PasswordStrengthLevel = 'weak';
  if (requiredMet === 4) {
    level = requirements.specialChar || password.length >= 12 ? 'strong' : 'medium';
  }

  return { requirements, requiredMet, level };
}
