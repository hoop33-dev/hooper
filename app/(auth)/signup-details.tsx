import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";

import {
  Input,
  SelectInput,
  DateInput,
  PhoneInput,
  Checkbox,
} from "@/src/components/ui";
import { NZ_REGIONS } from "@/src/constants/regions";
import { ROLES, type RoleId } from "./role-selector";

/* ── Age gate modal ──────────────────────────────────────────── */

type AgeGateModalProps = {
  visible: boolean;
  roleId: RoleId;
  onDismiss: () => void;
};

function AgeGateModal({ visible, roleId, onDismiss }: AgeGateModalProps) {
  const isPlayer = roleId === "player";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "flex-end",
        }}
      >
        <SafeAreaView
          style={{
            backgroundColor: "#2D2829",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderColor: "rgba(229,62,62,0.3)",
            padding: 24,
            paddingBottom: 32,
          }}
          edges={["bottom"]}
        >
          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(229,62,62,0.12)",
              borderWidth: 1.5,
              borderColor: "rgba(229,62,62,0.3)",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 20,
            }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#E53E3E"
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              <Path
                d="M12 9v4"
                stroke="#E53E3E"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={12} cy={16.5} r={1} fill="#E53E3E" />
            </Svg>
          </View>

          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "900",
              fontSize: 22,
              letterSpacing: 22 * -0.03,
              color: "#FFFFFF",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            You must be 16 or over
          </Text>

          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              color: "rgba(255,255,255,0.65)",
              textAlign: "center",
              lineHeight: 14 * 1.6,
              marginBottom: 28,
            }}
          >
            {isPlayer
              ? "Players must be at least 16 to create their own account. Ask a parent or guardian to sign up and add you as an athlete."
              : "You must be at least 16 years old to create a Hooper account."}
          </Text>

          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 9999,
              backgroundColor: "#E53E3E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "700",
                fontSize: 15,
                color: "#FFFFFF",
              }}
            >
              {isPlayer ? "Got it" : "Update date of birth"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* ── Error icon helper ───────────────────────────────────────── */

function ErrorMessage({ message }: { message: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
      }}
    >
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Circle cx={6} cy={6} r={5.5} stroke="#E53E3E" strokeWidth={1} />
        <Path
          d="M6 3.5V6.5"
          stroke="#E53E3E"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <Circle cx={6} cy={8.5} r={0.6} fill="#E53E3E" />
      </Svg>
      <Text style={{ fontFamily: "Inter", fontSize: 11, color: "#E53E3E" }}>
        {message}
      </Text>
    </View>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (!form.dob) e.dob = "Required";
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1A1718" }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 24,
              opacity: pressed ? 0.6 : 1,
              alignSelf: "flex-start",
            })}
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
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Choose your role
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: 10,
              letterSpacing: 10 * 0.14,
              textTransform: "uppercase",
              color: accent,
              marginBottom: 8,
            }}
          >
            Step 3 of 3
          </Text>

          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "900",
              fontSize: 26,
              letterSpacing: 26 * -0.03,
              color: "#FFFFFF",
              lineHeight: 26 * 1.12,
              marginBottom: 4,
            }}
          >
            Your details
          </Text>

          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 13,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 13 * 1.5,
            }}
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
          style={{ flex: 1 }}
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
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
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

          <DateInput
            label="Date of birth"
            value={form.dob}
            onChange={(d) => setField("dob", d)}
            maxDate={new Date()}
            error={errors.dob}
            placeholder="DD/MM/YYYY"
          />

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

          {/* Password */}
          <View>
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "500",
                fontSize: 10,
                letterSpacing: 10 * 0.12,
                textTransform: "uppercase",
                color: errors.password ? "#E53E3E" : "rgba(255,255,255,0.35)",
                marginBottom: 6,
              }}
            >
              Password
            </Text>
            <View style={{ position: "relative" }}>
              <Input
                value={form.password}
                onChangeText={(v) => setField("password", v)}
                placeholder="8+ characters"
                secureTextEntry={!showPassword}
                hasError={!!errors.password}
                autoComplete="new-password"
                textContentType="newPassword"
                inputClassName="pr-12"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                <EyeIcon visible={showPassword} />
              </Pressable>
            </View>
            {errors.password && <ErrorMessage message={errors.password} />}
          </View>

          {/* Confirm password */}
          <View>
            <Text
              style={{
                fontFamily: "Inter",
                fontWeight: "500",
                fontSize: 10,
                letterSpacing: 10 * 0.12,
                textTransform: "uppercase",
                color: errors.confirmPassword
                  ? "#E53E3E"
                  : "rgba(255,255,255,0.35)",
                marginBottom: 6,
              }}
            >
              Confirm password
            </Text>
            <View style={{ position: "relative" }}>
              <Input
                value={form.confirmPassword}
                onChangeText={(v) => setField("confirmPassword", v)}
                placeholder="Repeat your password"
                secureTextEntry={!showConfirmPassword}
                hasError={!!errors.confirmPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                inputClassName="pr-12"
              />
              <Pressable
                onPress={() => setShowConfirmPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                <EyeIcon visible={showConfirmPassword} />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <ErrorMessage message={errors.confirmPassword} />
            )}
          </View>

          {/* Disclosure */}
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
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#1A1718" }}>
          <View
            style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 }}
          >
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
                style={{
                  fontFamily: "Inter",
                  fontWeight: "700",
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
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

/* ── Eye icon for password toggle ───────────────────────────── */

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <Path d="M1 1l22 22" />
      </Svg>
    );
  }
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

/* ── Disclosure label with linked text ───────────────────────── */

function DisclosureLabel() {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 12.5,
        color: "rgba(255,255,255,0.65)",
        lineHeight: 12.5 * 1.55,
      }}
    >
      {"I confirm I am 16 or older and agree to Hooper's "}
      <Text style={{ color: "#0047BA", textDecorationLine: "underline" }}>
        Terms of Service
      </Text>{" "}
      and{" "}
      <Text style={{ color: "#0047BA", textDecorationLine: "underline" }}>
        Privacy Policy
      </Text>
      . I understand my data will be used to personalise my training experience.
    </Text>
  );
}
