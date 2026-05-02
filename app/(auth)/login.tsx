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

import {
  Input,
  PasswordInput,
  ErrorMessage,
  TextButton,
} from "@/src/components/ui";
import { signInWithUsername } from "@/src/services/auth.service";

const StyledSafeAreaView = styled(SafeAreaView);

export default function LoginScreen() {
  const router = useRouter();
  const passwordRef = useRef<RNTextInput>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    let valid = true;
    if (!username.trim()) {
      setUsernameError("Required");
      valid = false;
    } else {
      setUsernameError("");
    }
    if (!password) {
      setPasswordError("Required");
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  }

  async function handleSignIn() {
    setSubmitError("");
    if (!validate()) return;
    setIsSubmitting(true);
    const result = await signInWithUsername(username.trim(), password);
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    if (result.requiresVerification) {
      router.replace("/(auth)/verify-email");
      return;
    }
    router.replace("/dashboard");
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
            Welcome back
          </Text>
          <Text
            className="text-text-secondary text-[14px]"
            style={{ fontFamily: "Inter", lineHeight: 14 * 1.5 }}
          >
            Sign in to your account
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
          {submitError ? (
            <View
              style={{
                backgroundColor: "rgba(229,62,62,0.12)",
                borderWidth: 1,
                borderColor: "rgba(229,62,62,0.35)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 13,
                  color: "#E53E3E",
                  lineHeight: 18,
                }}
              >
                {submitError}
              </Text>
            </View>
          ) : null}

          <View>
            <Input
              label="Username"
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                setUsernameError("");
              }}
              placeholder="jordan33"
              hasError={!!usernameError}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            {usernameError ? <ErrorMessage message={usernameError} /> : null}
          </View>

          <View>
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text
                style={{
                  fontFamily: "Inter",
                  fontWeight: "500",
                  fontSize: 10,
                  letterSpacing: 10 * 0.12,
                  textTransform: "uppercase",
                  color: passwordError ? "#E53E3E" : "rgba(255,255,255,0.35)",
                }}
              >
                Password
              </Text>
              <TextButton
                tone="brand"
                weight="medium"
                size={12}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                Forgot password?
              </TextButton>
            </View>
            <PasswordInput
              ref={passwordRef}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setPasswordError("");
              }}
              placeholder="Your password"
              error={passwordError}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
          </View>
        </KeyboardAwareScrollView>

        {/* CTA */}
        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="gap-3 px-6 py-3">
              <Pressable
                onPress={handleSignIn}
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
                    Sign in
                  </Text>
                )}
              </Pressable>

              <View className="flex-row items-center justify-center gap-1.5">
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                  }}
                >
                  No account?
                </Text>
                <TextButton
                  tone="brand"
                  weight="semibold"
                  size={13}
                  onPress={() => router.push("/(auth)/role-selector")}
                >
                  Create one
                </TextButton>
              </View>
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>
    </StyledSafeAreaView>
  );
}
