import { useState, useRef } from "react";
import { View, type TextInput as RNTextInput } from "react-native";
import { useRouter } from "expo-router";

import {
  Input,
  DateInput,
  type DateInputHandle,
  PhoneInput,
  SelectInput,
  type SelectInputHandle,
  PasswordInput,
  ErrorMessage,
  AccountFormLayout,
} from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { NZ_REGIONS } from "@/src/constants/regions";
import { validatePassword } from "@/src/lib/passwordRules";
import { createChildAccount } from "@/src/services/parent.service";

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

    router.back();
  }

  return (
    <AccountFormLayout
      onBack={() => router.back()}
      title="Add a child"
      subtitle="Create a player account for your child"
      submitLabel="Create account"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
    >
      {/* Name row */}
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

      <View>
        <DateInput
          ref={dateInputRef}
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={(d) => setField("dateOfBirth", d)}
          maxDate={new Date()}
          placeholder="DD/MM/YYYY"
          accentColor={colors.brandOrange}
        />
        {errors.dateOfBirth && <ErrorMessage message={errors.dateOfBirth} />}
      </View>

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
    </AccountFormLayout>
  );
}
