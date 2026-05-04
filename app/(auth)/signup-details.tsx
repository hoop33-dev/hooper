import { useState, useRef } from "react";
import { View, Text, type TextInput as RNTextInput } from "react-native";
import {
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { useRouter, useLocalSearchParams } from "expo-router";

import { validatePassword } from "@/src/lib/passwordRules";
import {
  Input,
  SelectInput,
  type SelectInputHandle,
  DateInput,
  type DateInputHandle,
  PhoneInput,
  Checkbox,
  PasswordInput,
  ErrorMessage,
  AccountFormLayout,
} from "@/src/components/ui";
import { AgeGateModal } from "@/src/components/auth/AgeGateModal";
import { DisclosureLabel } from "@/src/components/auth/DisclosureLabel";
import { ROLES, type RoleId } from "@/src/constants/roles";
import { NZ_REGIONS } from "@/src/constants/regions";
import { signUp } from "@/src/services/auth.service";
import { useAuthStore } from "@/src/stores/auth.store";

type FormState = {
  firstName: string;
  lastName: string;
  dob: Date | null;
  username: string;
  email: string;
  mobile: string;
  region: string | null;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState | "disclosure", string>>;

function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function SignupDetailsScreen() {
  const router = useRouter();
  const { setVerificationPending } = useAuthStore();
  const { role } = useLocalSearchParams<{ role: RoleId }>();
  const roleId: RoleId = role ?? "player";
  const roleConfig = ROLES.find((r) => r.id === roleId) ?? ROLES[0];
  const accent = roleConfig.accent;

  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const lastNameRef = useRef<RNTextInput>(null);
  const dateInputRef = useRef<DateInputHandle>(null);
  const regionInputRef = useRef<SelectInputHandle>(null);
  const usernameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const mobileRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    dob: null,
    username: "",
    email: "",
    mobile: "",
    region: null,
    password: "",
    confirmPassword: "",
  });
  const [disclosure, setDisclosure] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [ageGateVisible, setAgeGateVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));

    if (key === "dob" && value instanceof Date) {
      if (calcAge(value) < 16) {
        setAgeGateVisible(true);
      } else {
        setTimeout(() => usernameRef.current?.focus(), 300);
      }
    }

    if (key === "region") {
      setTimeout(() => passwordRef.current?.focus(), 300);
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (roleId === "player" && !form.dob) e.dob = "Required";
    if (!form.username.trim()) e.username = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.mobile.trim()) e.mobile = "Required";
    if (!form.region) e.region = "Select your region";
    const pwError = validatePassword(form.password);
    if (pwError) e.password = pwError;
    if (!form.confirmPassword) e.confirmPassword = "Required";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    if (!disclosure) e.disclosure = "You must acknowledge the disclosure";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await signUp({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      email: form.email,
      mobile: form.mobile,
      regionSlug: form.region!,
      password: form.password,
      role: roleId,
      dateOfBirth: form.dob,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      if (result.field === "username") {
        setErrors((prev) => ({ ...prev, username: result.error }));
      } else if (result.field === "email") {
        setErrors((prev) => ({ ...prev, email: result.error }));
      } else {
        setSubmitError(result.error);
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setVerificationPending(form.email);
    router.replace("/(auth)/verify-email");
  }

  return (
    <AccountFormLayout
      onBack={() => router.back()}
      backLabel="Choose your role"
      stepLabel="Step 3 of 3"
      accentColor={accent}
      title="Your details"
      subtitle={
        <>
          {"Signing up as a "}
          <Text style={{ color: accent, fontWeight: "600" }}>
            {roleConfig.title}
          </Text>
        </>
      }
      scrollRef={scrollRef}
      submitLabel="Create account"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      footer={
        <AgeGateModal
          visible={ageGateVisible}
          roleId={roleId}
          onDismiss={() => {
            setAgeGateVisible(false);
            setField("dob", null);
          }}
        />
      }
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
            onSubmitEditing={() =>
              roleId === "player"
                ? dateInputRef.current?.open()
                : usernameRef.current?.focus()
            }
          />
          {errors.lastName && <ErrorMessage message={errors.lastName} />}
        </View>
      </View>

      {roleId === "player" && (
        <DateInput
          ref={dateInputRef}
          label="Date of birth"
          value={form.dob}
          onChange={(d) => setField("dob", d)}
          maxDate={new Date()}
          error={errors.dob}
          placeholder="DD/MM/YYYY"
          accentColor={accent}
        />
      )}

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
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        {errors.username && <ErrorMessage message={errors.username} />}
      </View>

      <View>
        <Input
          ref={emailRef}
          label="Email address"
          value={form.email}
          onChangeText={(v) => setField("email", v)}
          placeholder="you@email.com"
          hasError={!!errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => mobileRef.current?.focus()}
        />
        {errors.email && <ErrorMessage message={errors.email} />}
      </View>

      <PhoneInput
        ref={mobileRef}
        label="Mobile number"
        value={form.mobile}
        onChangeText={(v) => setField("mobile", v)}
        error={errors.mobile}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => regionInputRef.current?.open()}
      />

      <SelectInput
        ref={regionInputRef}
        label="Region"
        value={form.region}
        options={NZ_REGIONS}
        placeholder="Select your region"
        error={errors.region}
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
        placeholder="Repeat your password"
        error={errors.confirmPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />

      <Checkbox
        checked={disclosure}
        onChange={(v) => {
          setDisclosure(v);
          setErrors((e) => ({ ...e, disclosure: undefined }));
        }}
        label={<DisclosureLabel />}
        error={errors.disclosure}
      />
    </AccountFormLayout>
  );
}
