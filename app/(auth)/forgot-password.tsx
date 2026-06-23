import { useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { styled } from "nativewind";

import {
  Input,
  ErrorMessage,
  Button,
  BackButton,
  ErrorBanner,
} from "@/src/components/ui";
import { shadows } from "@/src/constants/theme";
import { sendPasswordResetEmail } from "@/src/services/auth.service";

const StyledSafeAreaView = styled(SafeAreaView);

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serviceError, setServiceError] = useState("");
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
    setServiceError("");
    const result = await sendPasswordResetEmail(email.trim());
    setIsSubmitting(false);
    if (!result.ok) {
      setServiceError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton
            label="Sign in"
            onPress={() => router.back()}
            className="mb-8"
          />

          <Text
            className="mb-1 font-black text-white"
            style={{
              fontFamily: "Outfit",
              fontSize: 28,
              letterSpacing: 28 * -0.03,
              lineHeight: 28 * 1.1,
            }}
          >
            Forgot password?
          </Text>
          <Text
            className="text-text-secondary text-[14px]"
            style={{ fontFamily: "Outfit", lineHeight: 14 * 1.5 }}
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
            <ErrorBanner
              variant="success"
              title="Reset link sent"
              message={`If an account exists for ${email}, you'll receive an email shortly.`}
            />
          ) : (
            <>
              {serviceError ? (
                <ErrorBanner variant="error" title="Error" message={serviceError} />
              ) : null}

              <View>
                <Input
                  label="Email address"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setEmailError("");
                    setServiceError("");
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

              {/* Child account notice */}
              <View
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <Text
                  className="text-text-secondary text-[13px]"
                  style={{ fontFamily: "Outfit", lineHeight: 13 * 1.5 }}
                >
                  <Text className="text-white" style={{ fontFamily: "Outfit" }}>
                    Child account?{" "}
                  </Text>
                  A parent can change your password from within the app — no
                  email reset needed.
                </Text>
              </View>
            </>
          )}
        </KeyboardAwareScrollView>

        {/* CTA */}
        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="px-6 py-3">
              {sent ? (
                <Button
                  variant="secondary"
                  onPress={() => router.back()}
                  size="lg"
                  className="w-full"
                >
                  Back to sign in
                </Button>
              ) : (
                <Button
                  onPress={handleSend}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full"
                  style={shadows.orangeGlow}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              )}
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>
    </StyledSafeAreaView>
  );
}
