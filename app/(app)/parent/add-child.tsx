import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useRef, useState } from "react";
import {
  Pressable,
  type TextInput as RNTextInput,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import {
  AccountFormLayout,
  DateInput,
  type DateInputHandle,
  ErrorMessage,
  Input,
  PasswordInput,
  PhoneInput,
  SelectInput,
  type SelectInputHandle,
} from "@/src/components/ui";
import { NZ_REGIONS } from "@/src/constants/regions";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { validatePassword } from "@/src/lib/passwordRules";
import { createChildAccount } from "@/src/services/parent.service";

const StyledSafeAreaView = styled(SafeAreaView);
const PARENT_ACCENT = roleConfig("parent").accent;

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

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  username: "",
  dateOfBirth: null,
  mobile: "",
  region: null,
  password: "",
  confirmPassword: "",
};

function SuccessView({
  childName,
  onAddAnother,
  onDone,
}: {
  childName: string;
  onAddAnother: () => void;
  onDone: () => void;
}) {
  return (
    <StyledSafeAreaView className="bg-surface flex-1" edges={["top", "bottom"]}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          gap: 24,
        }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: "rgba(52,211,153,0.12)",
            borderWidth: 1.5,
            borderColor: "rgba(52,211,153,0.3)",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
            <Path
              d="M8 18L15 25L28 11"
              stroke="#34D399"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontFamily: "Outfit",
              fontWeight: "700",
              fontSize: 22,
              color: colors.textPrimary,
            }}>
            Account created
          </Text>
          <Text
            style={{
              fontFamily: "Outfit",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 14 * 1.5,
            }}>
            {childName}&apos;s player account is ready.
          </Text>
        </View>

        <View style={{ width: "100%", gap: 12, marginTop: 8 }}>
          <Pressable
            onPress={onAddAnother}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 9999,
              backgroundColor: PARENT_ACCENT,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: PARENT_ACCENT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.45,
              shadowRadius: 16,
              elevation: 8,
            })}>
            <Text
              style={{
                fontFamily: "Outfit",
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 15 * 0.08,
                textTransform: "uppercase",
                color: colors.textPrimary,
              }}>
              Add another child
            </Text>
          </Pressable>

          <Pressable
            onPress={onDone}
            style={({ pressed }) => ({
              height: 56,
              borderRadius: 9999,
              backgroundColor: colors.surface2,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text
              style={{
                fontFamily: "Outfit",
                fontWeight: "600",
                fontSize: 15,
                color: colors.textSecondary,
              }}>
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </StyledSafeAreaView>
  );
}

export default function AddChildScreen() {
  const router = useRouter();

  const lastNameRef = useRef<RNTextInput>(null);
  const dateInputRef = useRef<DateInputHandle>(null);
  const mobileRef = useRef<RNTextInput>(null);
  const regionRef = useRef<SelectInputHandle>(null);
  const usernameRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [form, setFormState] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));

    if (key === "region") {
      setTimeout(() => usernameRef.current?.focus(), 300);
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.dateOfBirth) e.dateOfBirth = "Required";
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
      dateOfBirth: form.dateOfBirth!,
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

    setCreatedName(form.firstName);
  }

  if (createdName) {
    return (
      <SuccessView
        childName={createdName}
        onAddAnother={() => {
          setFormState(emptyForm);
          setErrors({});
          setSubmitError(null);
          setCreatedName(null);
        }}
        onDone={() => router.back()}
      />
    );
  }

  return (
    <AccountFormLayout
      onBack={() => router.back()}
      title="Add a child"
      subtitle="Create a player account for your child"
      accentColor={PARENT_ACCENT}
      submitLabel="Create account"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}>
      {/* Name row */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input
            label="First name"
            value={form.firstName}
            onChangeText={(v) => setField("firstName", v)}
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

      <View>
        <DateInput
          ref={dateInputRef}
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={(d) => setField("dateOfBirth", d)}
          maxDate={new Date()}
          placeholder="DD/MM/YYYY"
          accentColor={PARENT_ACCENT}
        />
        {errors.dateOfBirth && <ErrorMessage message={errors.dateOfBirth} />}
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

      <View>
        <Input
          ref={usernameRef}
          label="Username"
          value={form.username}
          onChangeText={(v) => setField("username", v)}
          hasError={!!errors.username}
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        {errors.username && <ErrorMessage message={errors.username} />}
      </View>

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
    </AccountFormLayout>
  );
}
