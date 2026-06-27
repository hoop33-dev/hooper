import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  AccentButton,
  BackButton,
  BodySm,
  Caption,
  H4,
  Label,
  OtpInput,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import {
  resendVerificationOtp,
  verifyEmailOtp,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { Session } from "@supabase/supabase-js";

const StyledSafeAreaView = styled(SafeAreaView);

// Tints not in the theme palette
const successColor = "#34D399";
const successDim = "rgba(52,211,153,0.12)";
const successBorder = "rgba(52,211,153,0.3)";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function EmailIllustration({ shake }: { shake: boolean }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shake) return;
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  }, [shake]);

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View className="bg-orange-tint-10 border-orange-tint-20 h-[72px] w-[72px] items-center justify-center rounded-[20px] border-[1.5px]">
        <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
          <Rect
            x={3}
            y={7}
            width={28}
            height={20}
            rx={4}
            stroke={colors.brandOrange}
            strokeWidth={1.8}
          />
          <Path
            d="M3 11L17 20L31 11"
            stroke={colors.brandOrange}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={25} cy={9} r={5} fill={colors.brandOrange} />
          <Path
            d="M22.5 9L24.2 10.8L27.5 7.5"
            stroke="white"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

function SuccessView({
  onContinue,
  isLoading,
  accent,
}: {
  onContinue: () => void;
  isLoading: boolean;
  accent: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      className="flex-1 items-center justify-center gap-5"
      style={{ opacity: opacityAnim }}>
      <Animated.View
        className="h-20 w-20 items-center justify-center rounded-3xl border-[1.5px]"
        style={{
          backgroundColor: successDim,
          borderColor: successBorder,
          transform: [{ scale: scaleAnim }],
        }}>
        <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
          <Path
            d="M8 18L15 25L28 11"
            stroke={successColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      <View className="items-center">
        <H4 className="mb-2">Email verified</H4>
        <BodySm className="text-center">
          Your account is ready.{"\n"}Let&apos;s get started.
        </BodySm>
      </View>

      <AccentButton
        accent={accent}
        loading={isLoading}
        onPress={onContinue}
        className="mt-4 w-full">
        Continue to Hooper
      </AccentButton>
    </Animated.View>
  );
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const {
    pendingVerificationEmail,
    pendingVerificationRole,
    status,
    profile,
    signInComplete,
    signOut,
  } = useAuthStore();
  // Step indicator and button accent follow the chosen role (orange/pale orange/blue);
  // defaults to player orange when role is not set (e.g. the sign-in path).
  const accent = roleConfig(pendingVerificationRole).accent;
  // profile is set by signInComplete (sign-in path) but null during sign-up
  // (profile not loaded yet because email isn't confirmed). Use this to adapt the UI.
  const fromSignIn = profile !== null;

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifiedSession, setVerifiedSession] = useState<Session | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);
  const [shake, setShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>(
    Array(CODE_LENGTH).fill(null),
  );

  useEffect(() => {
    // Only redirect when we're genuinely in needs_verification state with no email —
    // i.e. user landed here directly without going through sign-up/login.
    // When status transitions away (e.g. to "authenticated" after refreshProfile),
    // the route guard in _layout.tsx handles navigation; don't also fire here.
    if (status !== "needs_verification") return;
    if (!pendingVerificationEmail) {
      router.replace("/");
    }
  }, [pendingVerificationEmail, status, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const triggerVerify = useCallback(
    async (token: string) => {
      if (!pendingVerificationEmail || isVerifying) return;
      setIsVerifying(true);
      setErrorMsg("");
      const result = await verifyEmailOtp(pendingVerificationEmail, token);
      setIsVerifying(false);

      if (!result.ok) {
        setErrorMsg(result.error);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCode(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      setVerifiedSession(result.session);
      setIsSuccess(true);
    },
    [pendingVerificationEmail, isVerifying],
  );

  function handleChange(index: number, value: string) {
    // Handle full-code paste into first box
    if (value.length === CODE_LENGTH && index === 0) {
      const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = Array(CODE_LENGTH).fill("") as string[];
      digits.forEach((d, i) => {
        next[i] = d;
      });
      setCode(next);
      setErrorMsg("");
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      if (digits.length === CODE_LENGTH) triggerVerify(next.join(""));
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setErrorMsg("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && next.filter(Boolean).length === CODE_LENGTH) {
      triggerVerify(next.join(""));
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = "";
      setCode(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  const handleVerify = useCallback(() => {
    const token = code.join("");
    if (token.replace(/\s/g, "").length < CODE_LENGTH) {
      setErrorMsg("Enter all 6 digits");
      return;
    }
    triggerVerify(token);
  }, [code, triggerVerify]);

  async function handleContinue() {
    if (!verifiedSession) return;
    setIsContinuing(true);
    try {
      // Use the session returned by verifyOtp directly — avoids calling getUser()
      // which can return stale email_confirmed_at immediately after verification.
      await signInComplete(verifiedSession);
      // Guard in _layout.tsx fires from the status change and routes to the dashboard.
      // isContinuing intentionally not reset on success — screen unmounts.
    } catch {
      setIsContinuing(false);
    }
  }

  async function handleResend() {
    if (!pendingVerificationEmail || resendCooldown > 0) return;
    setIsResending(true);
    const result = await resendVerificationOtp(pendingVerificationEmail);
    setIsResending(false);

    if (!result.ok) {
      setErrorMsg(result.error);
      if (result.retryAfterSeconds) setResendCooldown(result.retryAfterSeconds);
      return;
    }

    setResendSent(true);
    setResendCooldown(RESEND_COOLDOWN);
    setCode(Array(CODE_LENGTH).fill(""));
    setErrorMsg("");
    setTimeout(() => setResendSent(false), 3000);
  }

  const maskedEmail = pendingVerificationEmail
    ? pendingVerificationEmail.replace(
        /(.{2})(.*)(@.*)/,
        (_m: string, a: string, _b: string, c: string) => `${a}···${c}`,
      )
    : "";

  const isComplete = code.filter(Boolean).length === CODE_LENGTH;

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      {/* Step header — hidden on success */}
      {!isSuccess && (
        <View className="px-6 pt-5">
          {!fromSignIn && (
            <Label className="mb-2.5" style={{ color: accent }}>
              Step 4 of 4
            </Label>
          )}
          <BackButton
            label={fromSignIn ? "Sign in" : "Your details"}
            onPress={async () => {
              // signOut() is required regardless of how we got here: the route
              // guard re-pins this screen while status is needs_verification, so
              // back navigation is a no-op until that status is cleared.
              await signOut();
              // The previous screen (signup-details / login) is still on the
              // stack via router.push, so return to it; fall back to the splash
              // when the app opened directly onto verify-email.
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
          />
        </View>
      )}

      {/* Body */}
      <View className="flex-1 px-6 pt-8 pb-10">
        {isSuccess ? (
          <SuccessView
            onContinue={handleContinue}
            isLoading={isContinuing}
            accent={accent}
          />
        ) : (
          <>
            {/* Icon + heading */}
            <View className="mb-10 items-center gap-5">
              <EmailIllustration shake={shake} />
              <View className="items-center">
                <H4 className="mb-2">Check your email</H4>
                <BodySm className="text-center">
                  We sent a 6-digit code to{"\n"}
                  <Text className="text-text-primary font-medium">
                    {maskedEmail}
                  </Text>
                </BodySm>
              </View>
            </View>

            {/* OTP boxes */}
            <OtpInput
              code={code}
              error={!!errorMsg}
              inputRefs={inputRefs}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />

            {/* Error / spacer */}
            <View className="mt-3 mb-8 h-5 items-center">
              {errorMsg ? (
                <Caption className="text-danger text-center">
                  Incorrect code — please try again
                </Caption>
              ) : null}
            </View>

            {/* Verify button */}
            <AccentButton
              accent={accent}
              variant={isComplete ? "solid" : "muted"}
              loading={isVerifying}
              disabled={!isComplete}
              onPress={handleVerify}
              className="mb-6">
              Verify email
            </AccentButton>

            {/* Resend row */}
            <View className="items-center">
              {resendSent ? (
                <BodySm style={{ color: successColor }}>
                  Code resent — check your inbox
                </BodySm>
              ) : (
                <BodySm className="text-text-tertiary">
                  Didn&apos;t get it?{" "}
                  <Text
                    onPress={
                      resendCooldown > 0 || isResending
                        ? undefined
                        : handleResend
                    }
                    className="font-semibold"
                    style={{
                      color:
                        resendCooldown > 0
                          ? colors.textTertiary
                          : colors.brandOrange,
                    }}>
                    {isResending
                      ? "Sending…"
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend code"}
                  </Text>
                </BodySm>
              )}
            </View>
          </>
        )}
      </View>
    </StyledSafeAreaView>
  );
}
