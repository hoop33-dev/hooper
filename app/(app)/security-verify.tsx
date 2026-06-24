import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { Text, View, type TextInput as RNTextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  AccentButton,
  BackButton,
  BodySm,
  Caption,
  H4,
  Hero,
  OtpInput,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import {
  sendSecurityCode,
  verifySecurityCode,
} from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function EmailIcon() {
  return (
    <View className="bg-orange-tint-10 border-orange-tint-20 h-[72px] w-[72px] items-center justify-center rounded-[20px] border-[1.5px]">
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

function ExpiryNotice() {
  return (
    <View className="border-border-subtle bg-surface-2 mb-5 flex-row items-start gap-2 rounded-[10px] px-3 py-2.5">
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
      <Caption className="flex-1">
        Code expires in 15 minutes. Check your spam folder if you don&apos;t see
        it.
      </Caption>
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
    <View className="mb-7 items-center">
      {resendSent ? (
        <BodySm style={{ color: "#34D399" }}>
          Code resent — check your inbox
        </BodySm>
      ) : (
        <BodySm className="text-text-tertiary">
          {"Didn't get it? "}
          <Text
            onPress={cooldown > 0 || isResending ? undefined : onResend}
            className="font-semibold"
            style={{
              color: cooldown > 0 ? colors.textTertiary : colors.brandOrange,
            }}>
            {isResending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend"}
          </Text>
        </BodySm>
      )}
    </View>
  );
}

function EmailPromptSection({ maskedEmail }: { maskedEmail: string }) {
  return (
    <View className="mb-9 items-center gap-5">
      <EmailIcon />
      <View className="items-center">
        <H4 className="mb-2">Check your email</H4>
        <BodySm className="text-center">
          {"We sent a 6-digit code to "}
          <Text className="text-text-primary font-semibold">
            {maskedEmail || "your email"}
          </Text>
          {". Enter it below."}
        </BodySm>
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
      <View className="px-6 pt-2">
        <BackButton label="Security" onPress={() => router.back()} />
      </View>
      <View className="px-6 pt-4 pb-2">
        <Hero>Security</Hero>
      </View>
      <View className="flex-1 px-6 pt-6">
        <EmailPromptSection maskedEmail={maskedEmail} />
        <OtpInput
          code={code}
          error={!!errorMsg}
          inputRefs={inputRefs}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
        />
        <View className="mt-3 mb-4 h-[18px] items-center">
          {errorMsg ? (
            <Caption className="text-danger text-center">{errorMsg}</Caption>
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
      <View className="px-6 pb-2">
        <AccentButton
          accent={colors.brandOrange}
          variant={isComplete ? "solid" : "muted"}
          loading={isVerifying}
          disabled={!isComplete}
          onPress={handleVerify}>
          Verify code
        </AccentButton>
      </View>
    </StyledSafeAreaView>
  );
}
