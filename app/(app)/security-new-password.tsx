import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Animated,
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
  BodySm,
  Button,
  ErrorBanner,
  H4,
  Hero,
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
    <View className="relative items-center">
      <View
        className="h-[88px] w-[88px] items-center justify-center rounded-[26px] border-[1.5px]"
        style={{ backgroundColor: successDim, borderColor: successBorder }}>
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
        className="absolute -right-1.5 -bottom-1.5 h-7 w-7 items-center justify-center rounded-full border-[2.5px]"
        style={{ backgroundColor: successColor, borderColor: colors.surface }}>
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
      className="flex-1 items-center justify-center px-8"
      style={{ opacity: opacityAnim }}>
      <Animated.View
        className="mb-7 items-center"
        style={{ transform: [{ scale: scaleAnim }] }}>
        <PasswordUpdatedIcon />
      </Animated.View>
      <H4 className="mb-2.5 text-center">Password updated.</H4>
      <BodySm className="text-center">
        Your account is secure. You&apos;re signed in automatically.
      </BodySm>
    </Animated.View>
  );
}

type NewPasswordFieldsProps = {
  password: string;
  confirmPassword: string;
  passwordError: string;
  confirmPasswordError: string;
  submitError: string;
  confirmRef: RefObject<RNTextInput | null>;
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
        <H4 className="mb-1.5">New password</H4>
        <BodySm>Choose a strong password you haven&apos;t used before.</BodySm>
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
    <View className="px-6 pt-2 pb-1">
      <BackButton label="Verify" onPress={onBack} className="mb-4" />
      <Hero>Security</Hero>
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
        <View className="px-6 py-3">
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
        <View className="px-6 pb-2">
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
      <View className="flex-1">
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
