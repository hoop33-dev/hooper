import { useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  type TextInput as RNTextInput,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { styled } from "nativewind";

import { PasswordInput, Button, BackButton, ErrorBanner } from "@/src/components/ui";
import { shadows } from "@/src/constants/theme";

const StyledSafeAreaView = styled(SafeAreaView);

export default function ResetPasswordScreen() {
  const router = useRouter();
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    let valid = true;
    if (!password) {
      setPasswordError("Required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Minimum 8 characters");
      valid = false;
    } else {
      setPasswordError("");
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Required");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }
    return valid;
  }

  async function handleReset() {
    if (!validate()) return;
    setIsSubmitting(true);
    // Password reset confirmation will go here
    setIsSubmitting(false);
    setDone(true);
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton onPress={() => router.back()} className="mb-8" />

          <Text
            className="mb-1 font-black text-white"
            style={{
              fontFamily: "Inter",
              fontSize: 28,
              letterSpacing: 28 * -0.03,
              lineHeight: 28 * 1.1,
            }}
          >
            Reset password
          </Text>
          <Text
            className="text-text-secondary text-[14px]"
            style={{ fontFamily: "Inter", lineHeight: 14 * 1.5 }}
          >
            {done
              ? "Your password has been updated."
              : "Choose a new password for your account."}
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
          {done ? (
            <ErrorBanner
              variant="success"
              title="Password updated"
              message="You can now sign in with your new password."
            />
          ) : (
            <>
              <PasswordInput
                label="New password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setPasswordError("");
                }}
                placeholder="8+ characters"
                error={passwordError}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />

              <PasswordInput
                ref={confirmPasswordRef}
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setConfirmPasswordError("");
                }}
                placeholder="Repeat your password"
                error={confirmPasswordError}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </>
          )}
        </KeyboardAwareScrollView>

        {/* CTA */}
        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="px-6 py-3">
              {done ? (
                <Button
                  onPress={() => router.replace("/(auth)/login")}
                  size="lg"
                  className="w-full"
                  style={shadows.orangeGlow}
                >
                  Sign in
                </Button>
              ) : (
                <Button
                  onPress={handleReset}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full"
                  style={shadows.orangeGlow}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    "Set new password"
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
