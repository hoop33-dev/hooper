import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import Svg, { Path } from "react-native-svg";

import { Input, ErrorMessage } from "@/src/components/ui";

const StyledSafeAreaView = styled(SafeAreaView);

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("Required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  }

  async function handleSend() {
    if (!validate()) return;
    setIsSubmitting(true);
    // Password reset integration will go here
    setIsSubmitting(false);
    setSent(true);
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="mb-8 flex-row items-center gap-1.5 self-start"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M10 3L5 8L10 13"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              className="text-text-tertiary text-[13px]"
              style={{ fontFamily: "Inter" }}
            >
              Sign in
            </Text>
          </Pressable>

          <Text
            className="mb-1 font-black text-white"
            style={{
              fontFamily: "Inter",
              fontSize: 28,
              letterSpacing: 28 * -0.03,
              lineHeight: 28 * 1.1,
            }}
          >
            Forgot password?
          </Text>
          <Text
            className="text-text-secondary text-[14px]"
            style={{ fontFamily: "Inter", lineHeight: 14 * 1.5 }}
          >
            {sent
              ? "Check your inbox — we've sent a reset link."
              : "Enter your email and we'll send you a reset link."}
          </Text>
        </View>

        {/* Form */}
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={120}
        >
          {sent ? (
            <View
              style={{
                backgroundColor: "rgba(56,161,105,0.12)",
                borderWidth: 1,
                borderColor: "rgba(56,161,105,0.35)",
                borderRadius: 10,
                padding: 16,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter",
                  fontWeight: "600",
                  fontSize: 14,
                  color: "#38A169",
                }}
              >
                Reset link sent
              </Text>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 13,
                  color: "rgba(56,161,105,0.85)",
                  lineHeight: 18,
                }}
              >
                If an account exists for {email}, you'll receive an email shortly.
              </Text>
            </View>
          ) : (
            <View>
              <Input
                label="Email address"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setEmailError("");
                }}
                placeholder="you@email.com"
                hasError={!!emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleSend}
              />
              {emailError ? <ErrorMessage message={emailError} /> : null}
            </View>
          )}
        </KeyboardAwareScrollView>

        {/* CTA */}
        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="px-6 py-3">
              {sent ? (
                <Pressable
                  onPress={() => router.back()}
                  style={({ pressed }) => ({
                    height: 52,
                    borderRadius: 9999,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.16)",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
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
                    Back to sign in
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleSend}
                  disabled={isSubmitting}
                  style={({ pressed }) => ({
                    height: 52,
                    borderRadius: 9999,
                    backgroundColor: "#F15825",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isSubmitting ? 0.7 : pressed ? 0.85 : 1,
                    transform: [{ scale: pressed && !isSubmitting ? 0.97 : 1 }],
                    shadowColor: "#F15825",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 8,
                  })}
                >
                  {isSubmitting ? (
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
                      Send reset link
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>
    </StyledSafeAreaView>
  );
}
