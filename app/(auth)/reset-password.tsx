import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
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
import Svg, { Path } from "react-native-svg";

import { PasswordInput } from "@/src/components/ui";

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
              Back
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
                Password updated
              </Text>
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 13,
                  color: "rgba(56,161,105,0.85)",
                  lineHeight: 18,
                }}
              >
                You can now sign in with your new password.
              </Text>
            </View>
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
                <Pressable
                  onPress={() => router.replace("/(auth)/login")}
                  style={({ pressed }) => ({
                    height: 52,
                    borderRadius: 9999,
                    backgroundColor: "#F15825",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: "#F15825",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 8,
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
                    Sign in
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleReset}
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
                      Set new password
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
