import { useState } from "react";
import { useRouter } from "expo-router";
import { signUpWithEmail } from "@/src/services/auth.service";

export interface SignUpFormErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  region?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 12;
}

export function useSignUp() {
  const router = useRouter();

  // Basic fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);

  // Adult fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Minor (parent) fields
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

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

  const isMinor = dateOfBirth ? getAge(dateOfBirth) < 16 : false;

  function validate(): SignUpFormErrors {
    const e: SignUpFormErrors = {};

    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!dateOfBirth) e.dateOfBirth = "Date of birth is required";

    if (isMinor) {
      if (!parentName.trim()) e.parentName = "Parent name is required";
      if (!parentEmail.trim()) {
        e.parentEmail = "Parent email is required";
      } else if (!isValidEmail(parentEmail)) {
        e.parentEmail = "Enter a valid email address";
      }
      if (!parentPhone.trim()) {
        e.parentPhone = "Parent phone number is required";
      } else if (!isValidPhone(parentPhone)) {
        e.parentPhone = "Enter a valid phone number";
      }
    } else {
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

    const authEmail = isMinor ? parentEmail.trim() : email.trim();

    const { error } = await signUpWithEmail({ email: authEmail, password });

    if (error) {
      setAuthError(error.message);
      setLoading(false);
      return;
    }

    const profileData = JSON.stringify({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth!.toISOString(),
      phone: isMinor ? null : phone.trim(),
      region,
      parentName: isMinor ? parentName.trim() : null,
      parentEmail: isMinor ? parentEmail.trim() : null,
      parentPhone: isMinor ? parentPhone.trim() : null,
    });

    setLoading(false);
    router.push({
      pathname: "/(auth)/verify",
      params: { email: authEmail, profileData },
    });
  }

  return {
    // Field values
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    parentName,
    parentEmail,
    parentPhone,
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
    setParentName,
    setParentEmail,
    setParentPhone,
    setRegion,
    setPassword,
    setConfirmPassword,
    setShowPassword,
    setShowConfirmPassword,
    setAgreedToTerms,
    // Derived
    isMinor,
    // UI state
    errors,
    authError,
    loading,
    // Actions
    handleSubmit,
  };
}
