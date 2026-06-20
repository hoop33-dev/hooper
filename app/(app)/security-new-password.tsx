import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import {
  BackButton,
  Button,
  ErrorBanner,
  PasswordInput,
} from "@/src/components/ui";
import { colors, shadows } from "@/src/constants/theme";
import { validatePassword } from "@/src/lib/passwordRules";
import { updatePassword } from "@/src/services/auth.service";

const StyledSafeAreaView = styled(SafeAreaView);

const successDim = "rgba(56,161,105,0.12)";
const successBorder = "rgba(56,161,105,0.30)";
const successColor = "#38A169";

function PasswordUpdatedIcon() {
  return (
    <View style={{ position: "relative", alignItems: "center" }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          backgroundColor: successDim,
          borderWidth: 1.5,
          borderColor: successBorder,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
          <Rect
            x={3}
            y={11}
            width={18}
            height={11}
            rx={3}
            stroke={successColor}
            strokeWidth={1.8}
          />
          <Path
            d="M7 11V7a5 5 0 0110 0v4"
            stroke={successColor}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M12 16v1"
            stroke={successColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: -6,
          right: -6,
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: successColor,
          borderWidth: 2.5,
          borderColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12l5 5L20 7"
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
}

function PasswordUpdatedView() {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        opacity: opacityAnim,
      }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
          marginBottom: 28,
        }}>
        <PasswordUpdatedIcon />
      </Animated.View>
      <Text
        style={{
          fontFamily: "Inter",
          fontWeight: "800",
          fontSize: 24,
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: 10,
          letterSpacing: 24 * -0.02,
        }}>
        Password updated.
      </Text>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 14 * 1.6,
        }}>
        {"Your account is secure. You're signed in automatically."}
      </Text>
    </Animated.View>
  );
}

type NewPasswordFieldsProps = {
  password: string;
  confirmPassword: string;
  passwordError: string;
  confirmPasswordError: string;
  submitError: string;
  confirmRef: RefObject<RNTextInput>;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  onSubmit: () => void;
};

function NewPasswordFields({
  password,
  confirmPassword,
  passwordError,
  confirmPasswordError,
  submitError,
  confirmRef,
  onPasswordChange,
  onConfirmChange,
  onSubmit,
}: NewPasswordFieldsProps) {
  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
        gap: 20,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={120}>
      <View>
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "800",
            fontSize: 22,
            color: colors.textPrimary,
            letterSpacing: 22 * -0.02,
            marginBottom: 6,
          }}>
          New password
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 14 * 1.55,
          }}>
          Choose a strong password you haven&apos;t used before.
        </Text>
      </View>
      {submitError ? (
        <ErrorBanner variant="error" title="Error" message={submitError} />
      ) : null}
      <PasswordInput
        label="New password"
        value={password}
        onChangeText={onPasswordChange}
        placeholder="8+ characters"
        error={passwordError}
        showStrength
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <PasswordInput
        ref={confirmRef}
        label="Confirm password"
        value={confirmPassword}
        onChangeText={onConfirmChange}
        placeholder="Repeat new password"
        error={confirmPasswordError}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </KeyboardAwareScrollView>
  );
}

function buildFormErrors(password: string, confirmPassword: string) {
  const pwError = validatePassword(password) ?? "";
  let confirmError = "";
  if (!confirmPassword) {
    confirmError = "Required";
  } else if (password !== confirmPassword) {
    confirmError = "Passwords don't match";
  }
  return { pwError, confirmError };
}

function useNewPasswordForm() {
  const confirmPasswordRef = useRef<RNTextInput>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  async function handleUpdate() {
    const { pwError, confirmError } = buildFormErrors(
      password,
      confirmPassword,
    );
    setPasswordError(pwError);
    setConfirmPasswordError(confirmError);
    if (pwError || confirmError) return;
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

  return {
    confirmPasswordRef,
    password,
    confirmPassword,
    passwordError,
    confirmPasswordError,
    isSubmitting,
    submitError,
    done,
    handleUpdate,
    onPasswordChange: (v: string) => {
      setPassword(v);
      setPasswordError("");
    },
    onConfirmChange: (v: string) => {
      setConfirmPassword(v);
      setConfirmPasswordError("");
    },
  };
}

function NewPasswordHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 }}>
      <BackButton label="Verify" onPress={onBack} className="mb-4" />
      <Text
        style={{
          fontFamily: "Inter",
          fontWeight: "900",
          fontSize: 28,
          color: colors.textPrimary,
          letterSpacing: 28 * -0.03,
          lineHeight: 28 * 1.1,
          marginBottom: 2,
        }}>
        Security
      </Text>
    </View>
  );
}

type SubmitButtonProps = {
  isSubmitting: boolean;
  canSubmit: boolean;
  onPress: () => void;
};

function SubmitButton({ isSubmitting, canSubmit, onPress }: SubmitButtonProps) {
  return (
    <KeyboardStickyView>
      <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
        <View style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
          <Button
            onPress={onPress}
            disabled={isSubmitting || !canSubmit}
            size="lg"
            className="w-full"
            style={!isSubmitting && canSubmit ? shadows.orangeGlow : undefined}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              "Update password"
            )}
          </Button>
        </View>
      </StyledSafeAreaView>
    </KeyboardStickyView>
  );
}

export default function SecurityNewPasswordScreen() {
  const router = useRouter();
  const form = useNewPasswordForm();

  if (form.done) {
    return (
      <StyledSafeAreaView
        className="bg-surface flex-1"
        edges={["top", "bottom"]}>
        <PasswordUpdatedView />
        <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
          <Button
            onPress={() => router.replace("/(app)/settings")}
            size="lg"
            className="w-full"
            style={shadows.orangeGlow}>
            Done
          </Button>
        </View>
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View style={{ flex: 1 }}>
        <NewPasswordHeader onBack={() => router.back()} />
        <NewPasswordFields
          password={form.password}
          confirmPassword={form.confirmPassword}
          passwordError={form.passwordError}
          confirmPasswordError={form.confirmPasswordError}
          submitError={form.submitError}
          confirmRef={form.confirmPasswordRef}
          onPasswordChange={form.onPasswordChange}
          onConfirmChange={form.onConfirmChange}
          onSubmit={form.handleUpdate}
        />
        <SubmitButton
          isSubmitting={form.isSubmitting}
          canSubmit={!!(form.password && form.confirmPassword)}
          onPress={form.handleUpdate}
        />
      </View>
    </StyledSafeAreaView>
  );
}
