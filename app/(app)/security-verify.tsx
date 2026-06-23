import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { BackButton } from "@/src/components/ui";
import { colors, fonts} from "@/src/constants/theme";
import {
  sendSecurityCode,
  verifySecurityCode,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const dangerDim = "rgba(229,62,62,0.12)";
const dangerBorder = "rgba(229,62,62,0.3)";
const orangeFilled = "rgba(241,88,37,0.08)";
const orangeFilledBorder = "rgba(241,88,37,0.45)";

function EmailIcon() {
  return (
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
      <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <Rect
          x={2}
          y={6}
          width={28}
          height={20}
          rx={4}
          stroke={colors.brandOrange}
          strokeWidth={1.8}
        />
        <Path
          d="M2 10L16 19L30 10"
          stroke={colors.brandOrange}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function useOtpInput(email: string, onSuccess: () => void) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(RNTextInput | null)[]>(
    Array(CODE_LENGTH).fill(null),
  );

  async function triggerVerify(token: string) {
    if (!email || isVerifying) return;
    setIsVerifying(true);
    setErrorMsg("");
    const result = await verifySecurityCode(email, token);
    setIsVerifying(false);
    if (!result.ok) {
      setErrorMsg(result.error);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      return;
    }
    onSuccess();
  }

  function handleChange(index: number, value: string) {
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
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && next.filter(Boolean).length === CODE_LENGTH)
      triggerVerify(next.join(""));
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = "";
      setCode(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerify() {
    const token = code.join("");
    if (token.replace(/\s/g, "").length < CODE_LENGTH) {
      setErrorMsg("Enter all 6 digits");
      return;
    }
    triggerVerify(token);
  }

  function reset() {
    setCode(Array(CODE_LENGTH).fill(""));
    setErrorMsg("");
  }

  const isComplete = code.filter(Boolean).length === CODE_LENGTH;

  return {
    code,
    errorMsg,
    setErrorMsg,
    isVerifying,
    isComplete,
    inputRefs,
    handleChange,
    handleKeyPress,
    handleVerify,
    reset,
  };
}

function useResend(onError: (msg: string) => void, onReset: () => void) {
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    const result = await sendSecurityCode();
    setIsResending(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    setResendSent(true);
    setResendCooldown(RESEND_COOLDOWN);
    onReset();
    setTimeout(() => setResendSent(false), 3000);
  }

  return { resendCooldown, isResending, resendSent, handleResend };
}

type OtpInputRowProps = {
  code: string[];
  errorMsg: string;
  inputRefs: { current: (RNTextInput | null)[] };
  onChange: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
};

function OtpInputRow({
  code,
  errorMsg,
  inputRefs,
  onChange,
  onKeyPress,
}: OtpInputRowProps) {
  return (
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
            onChangeText={(v) => onChange(i, v)}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
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
              fontFamily: fonts.bodySemi,
              fontWeight: "600",
              textAlign: "center",
            }}
          />
        );
      })}
    </View>
  );
}

function ExpiryNotice() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
      }}>
      <Svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        style={{ marginTop: 1 }}>
        <Circle
          cx={12}
          cy={12}
          r={9}
          stroke={colors.textTertiary}
          strokeWidth={1.8}
        />
        <Path
          d="M12 7v5l3 3"
          stroke={colors.textTertiary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textTertiary,
          lineHeight: 12 * 1.6,
          flex: 1,
        }}>
        {
          "Code expires in 15 minutes. Check your spam folder if you don't see it."
        }
      </Text>
    </View>
  );
}

type ResendRowProps = {
  cooldown: number;
  isResending: boolean;
  resendSent: boolean;
  onResend: () => void;
};

function ResendRow({
  cooldown,
  isResending,
  resendSent,
  onResend,
}: ResendRowProps) {
  return (
    <View style={{ alignItems: "center", marginBottom: 28 }}>
      {resendSent ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "#34D399" }}>
          Code resent — check your inbox
        </Text>
      ) : (
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 13,
            color: colors.textTertiary,
          }}>
          {"Didn't get it? "}
          <Text
            onPress={cooldown > 0 || isResending ? undefined : onResend}
            style={{
              fontWeight: "600",
              fontSize: 13,
              color: cooldown > 0 ? colors.textTertiary : colors.brandOrange,
            }}>
            {isResending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend"}
          </Text>
        </Text>
      )}
    </View>
  );
}

type VerifyButtonProps = {
  isComplete: boolean;
  isVerifying: boolean;
  onPress: () => void;
};

function VerifyButton({ isComplete, isVerifying, onPress }: VerifyButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isVerifying || !isComplete}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 14,
        backgroundColor: isComplete ? colors.brandOrange : colors.surface2,
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
      })}>
      {isVerifying ? (
        <ActivityIndicator
          color={isComplete ? colors.textPrimary : colors.textTertiary}
        />
      ) : (
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontWeight: "600",
            fontSize: 15,
            color: isComplete ? colors.textPrimary : colors.textTertiary,
          }}>
          Verify code
        </Text>
      )}
    </Pressable>
  );
}

function VerifyPageHeader({ onBack }: { onBack: () => void }) {
  return (
    <>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <BackButton label="Security" onPress={onBack} />
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: fonts.headingBlack,
            fontWeight: "900",
            fontSize: 28,
            color: colors.textPrimary,
            letterSpacing: 28 * 0.015,
            lineHeight: 28 * 1.1,
          }}>
          Security
        </Text>
      </View>
    </>
  );
}

function EmailPromptSection({ maskedEmail }: { maskedEmail: string }) {
  return (
    <View style={{ alignItems: "center", gap: 20, marginBottom: 36 }}>
      <EmailIcon />
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontWeight: "700",
            fontSize: 22,
            color: colors.textPrimary,
            marginBottom: 8,
          }}>
          Check your email
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 14 * 1.6,
            textAlign: "center",
          }}>
          {"We sent a 6-digit code to "}
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
            {maskedEmail || "your email"}
          </Text>
          {". Enter it below."}
        </Text>
      </View>
    </View>
  );
}

export default function SecurityVerifyScreen() {
  const router = useRouter();
  const { session } = useAuthStore();

  const email = session?.user?.email ?? "";
  const maskedEmail = email.replace(
    /(.{2})(.*)(@.*)/,
    (_m, a, _b, c) => `${a}···${c}`,
  );

  const {
    code,
    errorMsg,
    setErrorMsg,
    isVerifying,
    isComplete,
    inputRefs,
    handleChange,
    handleKeyPress,
    handleVerify,
    reset,
  } = useOtpInput(email, () => router.push("/(app)/security-new-password"));
  const { resendCooldown, isResending, resendSent, handleResend } = useResend(
    setErrorMsg,
    reset,
  );

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <VerifyPageHeader onBack={() => router.back()} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }}>
        <EmailPromptSection maskedEmail={maskedEmail} />
        <OtpInputRow
          code={code}
          errorMsg={errorMsg}
          inputRefs={inputRefs}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
        />
        <View style={{ height: 18, alignItems: "center", marginBottom: 16 }}>
          {errorMsg ? (
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.danger,
                textAlign: "center",
              }}>
              {errorMsg}
            </Text>
          ) : null}
        </View>
        <ExpiryNotice />
        <ResendRow
          cooldown={resendCooldown}
          isResending={isResending}
          resendSent={resendSent}
          onResend={handleResend}
        />
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
        <VerifyButton
          isComplete={isComplete}
          isVerifying={isVerifying}
          onPress={handleVerify}
        />
      </View>
    </StyledSafeAreaView>
  );
}
