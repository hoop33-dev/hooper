import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BackButton } from "@/src/components/ui";
import { roleConfig, type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import {
  resendVerificationOtp,
  verifyEmailOtp,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";
import type { Session } from "@supabase/supabase-js";

const StyledSafeAreaView = styled(SafeAreaView);

// Tints not in the theme palette
const dangerDim = "rgba(229,62,62,0.12)";
const dangerBorder = "rgba(229,62,62,0.3)";
const successColor = "#34D399";
const successDim = "rgba(52,211,153,0.12)";
const successBorder = "rgba(52,211,153,0.3)";
const orangeFilled = "rgba(241,88,37,0.08)";
const orangeFilledBorder = "rgba(241,88,37,0.45)";

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
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: colors.orangeTint10,
          borderWidth: 1.5,
          borderColor: colors.orangeTint20,
          alignItems: "center",
          justifyContent: "center",
        }}>
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
}: {
  onContinue: () => void;
  isLoading: boolean;
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
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        opacity: opacityAnim,
      }}>
      <Animated.View
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          backgroundColor: successDim,
          borderWidth: 1.5,
          borderColor: successBorder,
          alignItems: "center",
          justifyContent: "center",
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

      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "700",
            fontSize: 22,
            color: colors.textPrimary,
            marginBottom: 8,
          }}>
          Email verified
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 14 * 1.5,
            textAlign: "center",
          }}>
          Your account is ready.{"\n"}Let&apos;s get started.
        </Text>
      </View>

      <Pressable
        onPress={onContinue}
        disabled={isLoading}
        style={({ pressed }) => ({
          width: "100%",
          height: 56,
          borderRadius: 14,
          backgroundColor: colors.brandOrange,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          opacity: isLoading ? 0.7 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !isLoading ? 0.97 : 1 }],
          shadowColor: colors.brandOrange,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 8,
        })}>
        {isLoading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "600",
              fontSize: 15,
              color: colors.textPrimary,
            }}>
            Continue to Hooper
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: RoleId }>();
  // Step indicator accent follows the chosen role (orange/pale orange/blue);
  // defaults to the player orange when no role param is present.
  const accent = roleConfig(role).accent;
  const { pendingVerificationEmail, status, profile, signInComplete, signOut } =
    useAuthStore();
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
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {!fromSignIn && (
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 10,
                fontWeight: "500",
                letterSpacing: 10 * 0.14,
                textTransform: "uppercase",
                color: accent,
                marginBottom: 10,
              }}>
              Step 4 of 4
            </Text>
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
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
        }}>
        {isSuccess ? (
          <SuccessView onContinue={handleContinue} isLoading={isContinuing} />
        ) : (
          <>
            {/* Icon + heading */}
            <View style={{ alignItems: "center", gap: 20, marginBottom: 40 }}>
              <EmailIllustration shake={shake} />
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontWeight: "700",
                    fontSize: 22,
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}>
                  Check your email
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 14 * 1.6,
                    textAlign: "center",
                  }}>
                  We sent a 6-digit code to{"\n"}
                  <Text
                    style={{ color: colors.textPrimary, fontWeight: "500" }}>
                    {maskedEmail}
                  </Text>
                </Text>
              </View>
            </View>

            {/* OTP boxes */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                justifyContent: "center",
                marginBottom: 12,
              }}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                const filled = !!code[i];
                return (
                  <TextInput
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    value={code[i]}
                    onChangeText={(v) => handleChange(i, v)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(i, nativeEvent.key)
                    }
                    keyboardType="number-pad"
                    maxLength={i === 0 ? CODE_LENGTH : 1}
                    autoFocus={i === 0}
                    selectTextOnFocus
                    style={{
                      width: 46,
                      height: 58,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: errorMsg
                        ? dangerBorder
                        : filled
                          ? orangeFilledBorder
                          : colors.borderStrong,
                      backgroundColor: errorMsg
                        ? dangerDim
                        : filled
                          ? orangeFilled
                          : colors.surface2,
                      color: errorMsg ? colors.danger : colors.textPrimary,
                      fontSize: 24,
                      fontFamily: "Inter",
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  />
                );
              })}
            </View>

            {/* Error / spacer */}
            <View
              style={{ height: 20, alignItems: "center", marginBottom: 32 }}>
              {errorMsg ? (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    color: colors.danger,
                    textAlign: "center",
                  }}>
                  Incorrect code — please try again
                </Text>
              ) : null}
            </View>

            {/* Verify button */}
            <Pressable
              onPress={handleVerify}
              disabled={isVerifying || !isComplete}
              style={({ pressed }) => ({
                width: "100%",
                height: 56,
                borderRadius: 14,
                backgroundColor: isComplete
                  ? colors.brandOrange
                  : colors.surface2,
                alignItems: "center",
                justifyContent: "center",
                opacity: isVerifying ? 0.7 : pressed && isComplete ? 0.85 : 1,
                transform: [
                  { scale: pressed && isComplete && !isVerifying ? 0.97 : 1 },
                ],
                shadowColor: colors.brandOrange,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isComplete ? 0.35 : 0,
                shadowRadius: 20,
                elevation: isComplete ? 8 : 0,
                marginBottom: 24,
              })}>
              {isVerifying ? (
                <ActivityIndicator
                  color={isComplete ? colors.textPrimary : colors.textTertiary}
                />
              ) : (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontWeight: "600",
                    fontSize: 15,
                    color: isComplete
                      ? colors.textPrimary
                      : colors.textTertiary,
                  }}>
                  Verify email
                </Text>
              )}
            </Pressable>

            {/* Resend row */}
            <View style={{ alignItems: "center" }}>
              {resendSent ? (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: successColor,
                  }}>
                  Code resent — check your inbox
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: colors.textTertiary,
                  }}>
                  Didn&apos;t get it?{" "}
                  <Text
                    onPress={
                      resendCooldown > 0 || isResending
                        ? undefined
                        : handleResend
                    }
                    style={{
                      fontFamily: "Inter",
                      fontWeight: "600",
                      fontSize: 13,
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
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </StyledSafeAreaView>
  );
}
