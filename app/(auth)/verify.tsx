import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyledSafeAreaView } from "@/src/lib/nativewind-interop";
import {
  Button,
  Card,
  Heading2,
  Heading5,
  InlineButton,
  Label,
  Text,
  TextSM,
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { colors, fonts } from "@/src/constants/theme";

const OTP_LENGTH = 8;
const RESEND_SECONDS = 45;

export default function VerifyScreen() {
  const router = useRouter();
  const { email, firstName, lastName, dateOfBirth } = useLocalSearchParams<{
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleDigitChange(text: string, index: number) {
    const char = text.slice(-1).toUpperCase();
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const token = digits.join("");
    if (token.length < OTP_LENGTH) {
      setError("Please enter all 8 digits of your access code.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (verifyError || !data.session) {
        setError(verifyError?.message ?? "Verification failed. Please try again.");
        return;
      }

      // Insert the profile row now that the user is confirmed
      // region is required in the schema; will be collected in a later profile-completion step
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.session.user.id,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        region: "", // TODO: collect region in profile completion flow
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Check if the account is locked (under-16 users)
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_locked")
        .eq("id", data.session.user.id)
        .single();

      if (profile?.is_locked) {
        router.replace("/(auth)/locked");
      } else {
        // TODO: navigate to main app once root (tabs) screen exists
        router.replace("/(auth)/welcome");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await supabase.auth.resend({ type: "signup", email });
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setSecondsLeft(RESEND_SECONDS);
      setError("");
    } finally {
      setResending(false);
    }
  }

  const canResend = secondsLeft <= 0;

  return (
    <StyledSafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-6">
        {/* Icon */}
        <View className="mt-12 items-center">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surfaceHigh,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="mail-outline" size={36} color={colors.primary} />
          </View>
        </View>

        {/* Heading */}
        <View className="mt-6 items-center">
          <Heading2 className="text-center">
            {"VERIFY YOUR "}
            <Heading2 style={{ color: colors.primary }}>SPIRIT</Heading2>
          </Heading2>
          <Text className="mt-3 text-center text-on-surface-muted">
            {"We've sent an 8-digit OTP to your email\naddress. Enter it below to hit the court."}
          </Text>
        </View>

        {/* OTP input */}
        <View className="mt-8">
          <Label className="mb-3 tracking-widest text-on-surface-muted uppercase">
            ACCESS CODE
          </Label>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                value={digit}
                onChangeText={(t) => handleDigitChange(t, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
                maxLength={1}
                keyboardType="default"
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: colors.surfaceHigh,
                  borderRadius: 12,
                  textAlign: "center",
                  fontFamily: fonts.bold,
                  fontSize: 20,
                  color: colors.onSurface,
                  borderWidth: 1,
                  borderColor: digit ? colors.primary : "transparent",
                }}
                selectionColor={colors.primary}
              />
            ))}
          </View>
        </View>

        {error ? (
          <TextSM className="mt-3" style={{ color: colors.primary }}>
            {error}
          </TextSM>
        ) : null}

        {/* Verify button */}
        <Button
          onPress={handleVerify}
          disabled={loading}
          size="lg"
          className="mt-6"
        >
          {loading ? "VERIFYING…" : "VERIFY"}
        </Button>

        {/* Resend */}
        <View className="mt-4 items-center">
          {canResend ? (
            <InlineButton onPress={handleResend} disabled={resending}>
              {resending ? "RESENDING…" : "RESEND"}
            </InlineButton>
          ) : (
            <Label className="tracking-widest text-on-surface-muted uppercase">
              RESEND IN {formatCountdown(secondsLeft)}
            </Label>
          )}
        </View>

        {/* Info cards */}
        <View className="mt-8 flex-row gap-3">
          <Card className="flex-1">
            <View className="items-center gap-2 py-1">
              <Ionicons
                name="help-circle-outline"
                size={24}
                color={colors.primary}
              />
              <Heading5>NEED HELP?</Heading5>
              <TextSM className="text-center text-on-surface-muted">
                Contact trainer support
              </TextSM>
            </View>
          </Card>
          <Card className="flex-1">
            <View className="items-center gap-2 py-1">
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.onSurfaceMuted}
              />
              <Heading5>SECURITY</Heading5>
              <TextSM className="text-center text-on-surface-muted">
                Encrypted verification
              </TextSM>
            </View>
          </Card>
        </View>
      </View>
    </StyledSafeAreaView>
  );
}
