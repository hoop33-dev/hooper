import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { styled } from "nativewind";

import { ErrorMessage } from "@/src/components/ui";
import { verifyEmailOtp, resendVerificationOtp } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { pendingVerificationEmail, refreshProfile, setVerificationPending } =
    useAuthStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>(Array(CODE_LENGTH).fill(null));

  useEffect(() => {
    if (!pendingVerificationEmail) {
      router.replace("/");
    }
  }, [pendingVerificationEmail, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    // Accept paste of full code into first box
    if (value.length === CODE_LENGTH && index === 0) {
      const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
      const next = [...Array(CODE_LENGTH).fill("")];
      digits.forEach((d, i) => (next[i] = d));
      setCode(next);
      setError("");
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError("");

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
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

  const handleVerify = useCallback(async () => {
    const token = code.join("");
    if (token.length < CODE_LENGTH) {
      setError("Enter all 6 digits");
      return;
    }
    if (!pendingVerificationEmail) return;

    setIsVerifying(true);
    setError("");
    const result = await verifyEmailOtp(pendingVerificationEmail, token);
    setIsVerifying(false);

    if (!result.ok) {
      setError(result.error);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }

    await refreshProfile();
    // Guard in _layout.tsx will redirect to the appropriate dashboard
  }, [code, pendingVerificationEmail, refreshProfile]);

  async function handleResend() {
    if (!pendingVerificationEmail || resendCooldown > 0) return;
    setIsResending(true);
    const result = await resendVerificationOtp(pendingVerificationEmail);
    setIsResending(false);

    if (!result.ok) {
      setError(result.error);
      if (result.retryAfterSeconds) {
        setResendCooldown(result.retryAfterSeconds);
      }
      return;
    }

    setResendCooldown(RESEND_COOLDOWN);
  }

  const maskedEmail = pendingVerificationEmail
    ? pendingVerificationEmail.replace(/(.{2})(.*)(@.*)/, (_m, a, _b, c) => `${a}···${c}`)
    : "";

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8">
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "900",
            fontSize: 28,
            letterSpacing: 28 * -0.03,
            lineHeight: 28 * 1.1,
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          Check your email
        </Text>

        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 14 * 1.5,
            marginBottom: 40,
          }}
        >
          We sent a 6-digit code to{" "}
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{maskedEmail}</Text>
        </Text>

        {/* Code inputs */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={code[i]}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={i === 0 ? CODE_LENGTH : 1}
              autoFocus={i === 0}
              selectTextOnFocus
              style={{
                width: 46,
                height: 56,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: error
                  ? "rgba(229,62,62,0.6)"
                  : code[i]
                    ? "rgba(241,88,37,0.6)"
                    : "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#FFFFFF",
                fontSize: 22,
                fontFamily: "Inter",
                fontWeight: "700",
                textAlign: "center",
              }}
            />
          ))}
        </View>

        {error ? (
          <View style={{ marginBottom: 16 }}>
            <ErrorMessage message={error} />
          </View>
        ) : null}

        {/* Verify button */}
        <Pressable
          onPress={handleVerify}
          disabled={isVerifying}
          style={({ pressed }) => ({
            height: 52,
            borderRadius: 9999,
            backgroundColor: "#F15825",
            alignItems: "center",
            justifyContent: "center",
            opacity: isVerifying ? 0.7 : pressed ? 0.85 : 1,
            transform: [{ scale: pressed && !isVerifying ? 0.97 : 1 }],
            shadowColor: "#F15825",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 8,
            marginBottom: 20,
          })}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 15 * 0.08,
                textTransform: "uppercase",
                color: "#FFFFFF",
              }}
            >
              Verify
            </Text>
          )}
        </Pressable>

        {/* Resend */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Didn&apos;t receive it?
          </Text>
          <Pressable
            onPress={handleResend}
            disabled={resendCooldown > 0 || isResending}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "600",
                fontSize: 13,
                color:
                  resendCooldown > 0
                    ? "rgba(241,88,37,0.4)"
                    : "#F15825",
              }}
            >
              {isResending
                ? "Sending…"
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </StyledSafeAreaView>
  );
}
