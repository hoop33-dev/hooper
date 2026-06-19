import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  type TextInput as RNTextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { ErrorBanner, PasswordInput } from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors, shadows } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { validatePassword } from "@/src/lib/passwordRules";
import { updatePassword } from "@/src/services/auth.service";

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        alignSelf: "flex-start",
      }}>
      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        <Path
          d="M10 3L5 8L10 13"
          stroke={colors.textTertiary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 13,
          fontWeight: "500",
          color: colors.textTertiary,
        }}>
        Profile
      </Text>
    </Pressable>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 11 * 0.13,
        color: colors.textSecondary,
        textTransform: "uppercase",
        marginBottom: 14,
        marginTop: 8,
      }}>
      {title}
    </Text>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const role = user?.role ?? "player";
  const r = roleConfig(role);

  const guardian = useGuardianControls(role === "player");
  const isChild = guardian.isManaged;

  const confirmRef = useRef<RNTextInput>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    let valid = true;
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      setNewPasswordError(pwErr);
      valid = false;
    } else {
      setNewPasswordError("");
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Required");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      valid = false;
    } else {
      setConfirmPasswordError("");
    }
    return valid;
  }

  async function handleUpdate() {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}
        style={{ flex: 1 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 4 }}>
          <BackButton onPress={() => router.back()} />
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              fontWeight: "900",
              color: colors.textPrimary,
              letterSpacing: -26 * 0.03,
              marginBottom: 4,
            }}>
            Security
          </Text>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 14 * 1.5,
            }}>
            {isChild
              ? "Your guardian manages your security settings."
              : done
                ? "Your password has been updated."
                : "Update your password to keep your account secure."}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {isChild ? (
            /* Child account — locked */
            <View
              style={{
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: 14,
                padding: 18,
                gap: 12,
              }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: `${r.accent}14`,
                  borderWidth: 1,
                  borderColor: `${r.accent}30`,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M5 9V6.5C5 3.739 7.239 1.5 10 1.5C12.761 1.5 15 3.739 15 6.5V9"
                    stroke={r.accent}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                  <Path
                    d="M3.5 9H16.5C17.052 9 17.5 9.448 17.5 10V17C17.5 17.552 17.052 18 16.5 18H3.5C2.948 18 2.5 17.552 2.5 17V10C2.5 9.448 2.948 9 3.5 9Z"
                    stroke={r.accent}
                    strokeWidth={1.8}
                  />
                  <Path
                    d="M10 12.5V14.5"
                    stroke={r.accent}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 15,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}>
                  Managed by your guardian
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: colors.textSecondary,
                    lineHeight: 19,
                  }}>
                  Your parent or guardian can reset your password from within the Hooper app. Ask them to open the app and go to your account.
                </Text>
              </View>
            </View>
          ) : done ? (
            /* Success state */
            <>
              <ErrorBanner
                variant="success"
                title="Password updated"
                message="You can now sign in with your new password."
              />
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={[
                  {
                    marginTop: 20,
                    height: 52,
                    backgroundColor: r.accent,
                    borderRadius: 9999,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shadows.orangeGlow,
                ]}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#fff",
                  }}>
                  Done
                </Text>
              </Pressable>
            </>
          ) : (
            /* Change password form */
            <>
              <SectionHead title="Password" />

              {submitError ? (
                <View style={{ marginBottom: 16 }}>
                  <ErrorBanner variant="error" title="Error" message={submitError} />
                </View>
              ) : null}

              <View style={{ gap: 14 }}>
                <PasswordInput
                  label="New password"
                  value={newPassword}
                  onChangeText={(v) => {
                    setNewPassword(v);
                    setNewPasswordError("");
                    setSubmitError("");
                  }}
                  placeholder="Min 8 chars, uppercase & number"
                  error={newPasswordError}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />

                <PasswordInput
                  ref={confirmRef}
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
                  onSubmitEditing={handleUpdate}
                />
              </View>

              <Pressable
                onPress={handleUpdate}
                disabled={isSubmitting}
                accessibilityRole="button"
                style={[
                  {
                    marginTop: 24,
                    height: 52,
                    backgroundColor: isSubmitting
                      ? `${r.accent}80`
                      : r.accent,
                    borderRadius: 9999,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shadows.orangeGlow,
                ]}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#fff",
                    }}>
                    Update password
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
