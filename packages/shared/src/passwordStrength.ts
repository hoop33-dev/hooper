export type StrengthLevel = "empty" | "too_short" | "weak" | "fair" | "strong";

export type PasswordStrength = {
  level: StrengthLevel;
  label: string;
  color: string;
  filledSegments: number;
};

const RED = "#E53E3E";
const AMBER = "#F59E0B";
const GREEN = "#38A169";

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: "empty", label: "", color: RED, filledSegments: 0 };
  }

  if (password.length < 8) {
    return {
      level: "too_short",
      label: "Too short",
      color: RED,
      filledSegments: 1,
    };
  }

  const criteriaCount = [
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (criteriaCount <= 1) {
    return { level: "weak", label: "Weak", color: RED, filledSegments: 1 };
  }
  if (criteriaCount === 2) {
    return { level: "fair", label: "Fair", color: AMBER, filledSegments: 2 };
  }
  return { level: "strong", label: "Strong", color: GREEN, filledSegments: 4 };
}
