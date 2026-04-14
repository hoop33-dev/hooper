import { useState } from "react";
import { useRouter } from "expo-router";
import { signUpWithEmail } from "@/src/services/auth.service";

export interface SignUpFormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  region?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

// Validates the local NZ number (user types without +64 prefix).
// NZ numbers: mobile 02x = 7–9 local digits; landline = 7–9 digits.
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 10;
}

export function useSignUp() {
  const router = useRouter();

  // Basic fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  // Contact fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Shared fields
  const [region, setRegion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): SignUpFormErrors {
    const e: SignUpFormErrors = {};

    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!dateOfBirth) {
      e.dateOfBirth = "Date of birth is required";
    } else if (dateOfBirth > new Date()) {
      e.dateOfBirth = "Date of birth cannot be in the future";
    }

    if (!email.trim()) {
      e.email = "Email address is required";
    } else if (!isValidEmail(email)) {
      e.email = "Enter a valid email address";
    }
    if (!phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!isValidPhone(phone)) {
      e.phone = "Enter a valid phone number";
    }

    if (!region) e.region = "Please select a region";

    if (!password) {
      e.password = "Password is required";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      e.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      e.password = "Password must contain at least one number";
    }

    if (!confirmPassword) {
      e.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      e.confirmPassword = "Passwords do not match";
    }

    if (!agreedToTerms) {
      e.agreedToTerms =
        "You must agree to the Terms of Service and Privacy Policy";
    }

    return e;
  }

  async function handleSubmit() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setAuthError(null);
    setLoading(true);

    try {
      const { data, error } = await signUpWithEmail({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      // When email confirmations are enabled, Supabase silently returns
      // { user: null, error: null } for already-registered emails rather than
      // exposing whether the address exists. Detect and surface it.
      if (!data.user) {
        setAuthError(
          "An account with this email address already exists. Please sign in instead.",
        );
        setLoading(false);
        return;
      }

      const profileData = JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth!.toISOString(),
        phone: phone.trim() || null,
        region,
      });

      setLoading(false);
      router.push({
        pathname: "/(auth)/verify",
        params: { email: email.trim(), profileData },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Sign up failed. Please try again.";
      setAuthError(message);
      setLoading(false);
    }
  }

  return {
    // Field values
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    region,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    agreedToTerms,
    // Setters
    setFirstName,
    setLastName,
    setDateOfBirth,
    setEmail,
    setPhone,
    setRegion,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    setAgreedToTerms,
    // UI state
    errors,
    authError,
    loading,
    // Actions
    handleSubmit,
  };
}
