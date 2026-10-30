import { useLocalSearchParams, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
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
  ErrorBanner,
  Hero,
  PasswordInput,
} from "@/src/components/ui";
import { shadows } from "@/src/constants/theme";
import { validatePassword } from "@/src/lib/passwordRules";
import {
  exchangeResetCode,
  setResetSession,
  updatePassword,
} from "@/src/services/auth.service";

const StyledSafeAreaView = styled(SafeAreaView);

export default function ResetPasswordScreen() {
  const router = useRouter();
  // "Forgot password" in the app sends a PKCE `?code=`. A reset a coach
  // sends from the portal is started server-side, so it can't be PKCE (this
  // device has no code verifier) and arrives as `#access_token=…` instead —
  // expo-router hands the fragment over as the "#" param.
  const { code, "#": hash } = useLocalSearchParams<{
    code?: string;
    "#"?: string;
  }>();
  const fragment = new URLSearchParams(hash ?? "");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  const linkError = fragment.get("error");
  const hasLink = !!code || !!(accessToken && refreshToken);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [exchangeError, setExchangeError] = useState("");
  const [isExchanging, setIsExchanging] = useState(hasLink);
  const [sessionReady, setSessionReady] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!hasLink) {
      setExchangeError(
        linkError
          ? "Reset link is invalid or expired."
          : "No reset code found. Please use the link from your email.",
      );
      return;
    }
    let cancelled = false;
    setIsExchanging(true);
    const verify = code
      ? exchangeResetCode(code)
      : setResetSession(accessToken!, refreshToken!);
    verify.then((result) => {
      if (cancelled) return;
      setIsExchanging(false);
      if (!result.ok) {
        setExchangeError(result.error);
      } else {
        setSessionReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, accessToken, refreshToken, hasLink, linkError]);

  function validate(): boolean {
    let valid = true;
    const pwErr = validatePassword(password);
    if (pwErr) {
      setPasswordError(pwErr);
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
    setSubmitError("");
    const result = await updatePassword(password);
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <BackButton onPress={() => router.back()} className="mb-9" />

          <Hero className="mb-1">Reset password</Hero>
          <BodySm>
            {done
              ? "Your password has been updated."
              : "Choose a new password for your account."}
          </BodySm>
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
          {done ? (
            <ErrorBanner
              variant="success"
              title="Password updated"
              message="You can now sign in with your new password."
            />
          ) : isExchanging ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#fff" />
              <BodySm className="mt-3">Verifying reset link…</BodySm>
            </View>
          ) : exchangeError ? (
            <ErrorBanner
              variant="error"
              title="Link invalid or expired"
              message={exchangeError}
            />
          ) : (
            <>
              {submitError ? (
                <ErrorBanner
                  variant="error"
                  title="Error"
                  message={submitError}
                />
              ) : null}

              <PasswordInput
                label="New password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setPasswordError("");
                }}
                placeholder="Min 8 chars, uppercase & number"
                error={passwordError}
                showStrength
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
                  style={shadows.orangeGlow}>
                  Sign in
                </Button>
              ) : exchangeError ? (
                <Button
                  variant="secondary"
                  onPress={() => router.replace("/(auth)/forgot-password")}
                  size="lg"
                  className="w-full">
                  Request a new link
                </Button>
              ) : (
                <Button
                  onPress={handleReset}
                  disabled={isSubmitting || isExchanging || !sessionReady}
                  size="lg"
                  className="w-full"
                  style={shadows.orangeGlow}>
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
