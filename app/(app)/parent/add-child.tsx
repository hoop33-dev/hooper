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
  DateInput,
  type DateInputHandle,
  PhoneInput,
  SelectInput,
  type SelectInputHandle,
  PasswordInput,
  ErrorMessage,
} from "@/src/components/ui";
import { NZ_REGIONS } from "@/src/constants/regions";
import { validatePassword } from "@/src/lib/passwordRules";
import { createChildAccount } from "@/src/services/parent.service";

const StyledSafeAreaView = styled(SafeAreaView);

type FormState = {
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: Date | null;
  mobile: string;
  region: string | null;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function AddChildScreen() {
  const router = useRouter();

  const lastNameRef = useRef<RNTextInput>(null);
  const dateInputRef = useRef<DateInputHandle>(null);
  const usernameRef = useRef<RNTextInput>(null);
  const mobileRef = useRef<RNTextInput>(null);
  const regionRef = useRef<SelectInputHandle>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    username: "",
    dateOfBirth: null,
    mobile: "",
    region: null,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.username.trim()) e.username = "Required";
    const pwError = validatePassword(form.password);
    if (pwError) e.password = pwError;
    if (!form.confirmPassword) e.confirmPassword = "Required";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await createChildAccount({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      password: form.password,
      dateOfBirth: form.dateOfBirth,
      regionSlug: form.region,
      mobile: form.mobile || null,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      if (result.field === "username") {
        setErrors((prev) => ({ ...prev, username: result.error }));
      } else if (result.field === "password") {
        setErrors((prev) => ({ ...prev, password: result.error }));
      } else {
        setSubmitError(result.error);
      }
      return;
    }

    router.back();
  }

  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1.5 self-start"
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
            style={{
              fontFamily: "Inter",
              fontWeight: "900",
              fontSize: 26,
              letterSpacing: 26 * -0.03,
              lineHeight: 26 * 1.12,
              color: "#FFFFFF",
              marginBottom: 4,
            }}
          >
            Add a child
          </Text>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 13 * 1.5,
            }}
          >
            Create a player account for your child
          </Text>
        </View>

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

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="First name"
                value={form.firstName}
                onChangeText={(v) => setField("firstName", v)}
                placeholder="Jordan"
                hasError={!!errors.firstName}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              {errors.firstName && <ErrorMessage message={errors.firstName} />}
            </View>
            <View className="flex-1">
              <Input
                ref={lastNameRef}
                label="Last name"
                value={form.lastName}
                onChangeText={(v) => setField("lastName", v)}
                placeholder="Taylor"
                hasError={!!errors.lastName}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => dateInputRef.current?.open()}
              />
              {errors.lastName && <ErrorMessage message={errors.lastName} />}
            </View>
          </View>

          <DateInput
            ref={dateInputRef}
            label="Date of birth (optional)"
            value={form.dateOfBirth}
            onChange={(d) => setField("dateOfBirth", d)}
            maxDate={new Date()}
            placeholder="DD/MM/YYYY"
            accentColor="#34D399"
          />

          <View>
            <Input
              ref={usernameRef}
              label="Username"
              value={form.username}
              onChangeText={(v) => setField("username", v)}
              placeholder="jordan33"
              hasError={!!errors.username}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => mobileRef.current?.focus()}
            />
            {errors.username && <ErrorMessage message={errors.username} />}
          </View>

          <PhoneInput
            ref={mobileRef}
            label="Mobile (optional)"
            value={form.mobile}
            onChangeText={(v) => setField("mobile", v)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => regionRef.current?.open()}
          />

          <SelectInput
            ref={regionRef}
            label="Region (optional — inherits yours if blank)"
            value={form.region}
            options={NZ_REGIONS}
            placeholder="Select region"
            onChange={(v) => setField("region", v)}
          />

          <PasswordInput
            ref={passwordRef}
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="8+ characters"
            error={errors.password}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />

          <PasswordInput
            ref={confirmPasswordRef}
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            placeholder="Repeat password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
          />
        </KeyboardAwareScrollView>

        <KeyboardStickyView>
          <StyledSafeAreaView edges={["bottom"]} className="bg-surface">
            <View className="px-6 py-3">
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 9999,
                  backgroundColor: "#34D399",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isSubmitting ? 0.7 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed && !isSubmitting ? 0.97 : 1 }],
                  shadowColor: "#34D399",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 6,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "Inter",
                      fontWeight: "700",
                      fontSize: 15,
                      letterSpacing: 15 * 0.08,
                      textTransform: "uppercase",
                      color: "#000000",
                    }}
                  >
                    Create account
                  </Text>
                )}
              </Pressable>
            </View>
          </StyledSafeAreaView>
        </KeyboardStickyView>
      </View>
    </StyledSafeAreaView>
  );
}
