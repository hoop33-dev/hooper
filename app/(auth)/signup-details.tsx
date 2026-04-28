import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";

import {
  Input,
  SelectInput,
  DateInput,
  PhoneInput,
  Checkbox,
  PasswordInput,
  ErrorMessage,
} from "@/src/components/ui";
import { AgeGateModal } from "@/src/components/auth/AgeGateModal";
import { DisclosureLabel } from "@/src/components/auth/DisclosureLabel";
import { ROLES, type RoleId } from "@/src/constants/roles";
import { NZ_REGIONS } from "@/src/constants/regions";

/* ── Form state ──────────────────────────────────────────────── */

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

/* ── Screen ──────────────────────────────────────────────────── */

export default function SignupDetailsScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: RoleId }>();
  const roleId: RoleId = role ?? "player";
  const roleConfig = ROLES.find((r) => r.id === roleId) ?? ROLES[0];

  const scrollRef = useRef<ScrollView>(null);

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

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));

    if (key === "dob" && value instanceof Date) {
      if (calcAge(value) < 16) {
        setAgeGateVisible(true);
      }
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
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Required";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords don't match";
    if (!disclosure) e.disclosure = "You must acknowledge the disclosure";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    // TODO: hook up Supabase signup
  }

  function dismissAgeGate() {
    setAgeGateVisible(false);
    setField("dob", null);
  }

  const accent = roleConfig.accent;

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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
              Choose your role
            </Text>
          </Pressable>

          <Text
            className="mb-2 text-[10px] font-medium uppercase"
            style={{
              fontFamily: "Inter",
              letterSpacing: 10 * 0.14,
              color: accent,
            }}
          >
            Step 3 of 3
          </Text>

          <Text
            className="text-text-primary mb-1 font-black"
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              letterSpacing: 26 * -0.03,
              lineHeight: 26 * 1.12,
            }}
          >
            Your details
          </Text>

          <Text
            className="text-text-secondary text-[13px]"
            style={{ fontFamily: "Inter", lineHeight: 13 * 1.5 }}
          >
            Signing up as a{" "}
            <Text style={{ color: accent, fontWeight: "600" }}>
              {roleConfig.title}
            </Text>
          </Text>
        </View>

        {/* Scrollable form */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              />
              {errors.firstName && <ErrorMessage message={errors.firstName} />}
            </View>
            <View className="flex-1">
              <Input
                label="Last name"
                value={form.lastName}
                onChangeText={(v) => setField("lastName", v)}
                placeholder="Taylor"
                hasError={!!errors.lastName}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
              />
              {errors.lastName && <ErrorMessage message={errors.lastName} />}
            </View>
          </View>

          {roleId === "player" && (
            <DateInput
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
              label="Username"
              value={form.username}
              onChangeText={(v) => setField("username", v)}
              placeholder="jordan33"
              hasError={!!errors.username}
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
            />
            {errors.username && <ErrorMessage message={errors.username} />}
          </View>

          <View>
            <Input
              label="Email address"
              value={form.email}
              onChangeText={(v) => setField("email", v)}
              placeholder="you@email.com"
              hasError={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {errors.email && <ErrorMessage message={errors.email} />}
          </View>

          <PhoneInput
            label="Mobile number"
            value={form.mobile}
            onChangeText={(v) => setField("mobile", v)}
            error={errors.mobile}
          />

          <SelectInput
            label="Region"
            value={form.region}
            options={NZ_REGIONS}
            placeholder="Select your region"
            error={errors.region}
            onChange={(v) => setField("region", v)}
          />

          <PasswordInput
            label="Password"
            value={form.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="8+ characters"
            error={errors.password}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <PasswordInput
            label="Confirm password"
            value={form.confirmPassword}
            onChangeText={(v) => setField("confirmPassword", v)}
            placeholder="Repeat your password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            textContentType="newPassword"
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
        </ScrollView>

        {/* Submit CTA */}
        <SafeAreaView edges={["bottom"]} className="bg-surface">
          <View className="px-6 py-3">
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => ({
                height: 52,
                borderRadius: 9999,
                backgroundColor: accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 8,
              })}
            >
              <Text
                className="text-text-primary text-[15px] font-bold"
                style={{ fontFamily: "Inter" }}
              >
                Create account
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <AgeGateModal
        visible={ageGateVisible}
        roleId={roleId}
        onDismiss={dismissAgeGate}
      />
    </SafeAreaView>
  );
}
