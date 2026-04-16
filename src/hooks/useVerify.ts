import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createProfile,
  resendOtp,
  verifyOtp,
} from "@/src/services/auth.service";

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string | null;
  region: string;
}

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function useVerify() {
  const router = useRouter();
  const { email, profileData } = useLocalSearchParams<{
    email: string;
    profileData: string;
  }>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    if (code.length !== 6 || !email) return;

    setLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await verifyOtp(email, code);

      if (error || !data.user) {
        setAuthError(
          error?.message ?? "Verification failed. Please try again.",
        );
        setLoading(false);
        return;
      }

      if (profileData) {
        const profile: ProfileData = JSON.parse(profileData) as ProfileData;
        await createProfile({
          id: data.user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          date_of_birth: profile.dateOfBirth.split("T")[0],
          phone: profile.phone,
          region: profile.region,
        });

        const dob = new Date(profile.dateOfBirth);
        const isLocked = getAge(dob) < 16;
        router.replace(isLocked ? "/(app)/locked" : "/(app)");
      } else {
        router.replace("/(app)");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.";
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;

    try {
      await resendOtp(email);
      setCooldown(30);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to resend code right now.";
      setAuthError(message);
    }
  }

  return {
    email,
    code,
    setCode,
    loading,
    authError,
    cooldown,
    handleVerify,
    handleResend,
  };
}
