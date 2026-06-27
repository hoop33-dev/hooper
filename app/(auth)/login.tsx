import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  BackButton,
  BodySm,
  Button,
  Caption,
  ErrorBanner,
  ErrorMessage,
  Hero,
  Input,
  Label,
  PasswordInput,
  TextButton,
} from "@/src/components/ui";
import { shadows } from "@/src/constants/theme";
import { signInWithUsername } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

const StyledSafeAreaView = styled(SafeAreaView);

export default function LoginScreen() {
  const router = useRouter();
  const { signInComplete, setVerificationPending } = useAuthStore();
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
    if (!result.ok) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    // Unverified account: route to verify-email; OTP completes the sign-in.
    // push (not replace) keeps login on the stack so verify-email's back works.
    // Because the screen stays mounted, reset isSubmitting so the button isn't
    // stuck loading when the user navigates back.
    if (result.requiresVerification) {
      setIsSubmitting(false);
      setVerificationPending(result.email);
      router.push("/(auth)/verify-email");
      return;
    }

    try {
      await signInComplete(result.session);
      // isSubmitting intentionally not reset — guard navigates away and screen unmounts.
    } catch {
      setIsSubmitting(false);
      setSubmitError("Unable to sign in. Please try again.");
    }
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton
            label="Back"
            onPress={() => router.back()}
            className="mb-8"
          />

          <Hero className="mb-1">Welcome back</Hero>
          <BodySm>Sign in to your account</BodySm>
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
          bottomOffset={120}>
          {submitError ? <ErrorBanner message={submitError} /> : null}

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
              <Label className={passwordError ? "text-danger" : ""}>
                Password
              </Label>
              <TextButton
                tone="brand"
                weight="medium"
                size={12}
                onPress={() => router.push("/(auth)/forgot-password")}>
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
              <Button
                onPress={handleSignIn}
                disabled={isSubmitting}
                size="lg"
                className="w-full"
                style={shadows.orangeGlow}>
                {isSubmitting ? <ActivityIndicator color="#fff" /> : "Sign in"}
              </Button>

              <View className="flex-row items-center justify-center gap-1.5">
                <Caption className="text-text-tertiary">No account?</Caption>
                <TextButton
                  tone="brand"
                  weight="semibold"
                  size={13}
                  onPress={() => router.push("/(auth)/role-selector")}>
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
