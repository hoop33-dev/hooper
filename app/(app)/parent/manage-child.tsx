import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { Avatar } from "@/src/components/dashboard/Avatar";
import {
  ChevronIcon,
  CreditIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/src/components/dashboard/icons";
import { DateInput, type DateInputHandle } from "@/src/components/ui/DateInput";
import {
  SelectInput,
  type SelectOption,
} from "@/src/components/ui/SelectInput";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";
import { ageFromDob } from "@/src/lib/age";
import { supabase } from "@/src/lib/supabase";
import {
  getChildProfile,
  updateChildProfile,
} from "@/src/services/parent.service";

const PARENT = roleConfig("parent");

/* ─── Small primitives (kept local, mirroring profile-settings) ─ */

function BackButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 18,
        alignSelf: "flex-start",
      }}
    >
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
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 11 * 0.14,
        textTransform: "uppercase",
        color: colors.textSecondary,
        marginTop: 12,
        marginBottom: 14,
      }}
    >
      {children}
    </Text>
  );
}

function FieldLabel({
  children,
  error,
}: {
  children: string;
  error?: boolean;
}) {
  return (
    <Text
      style={{
        fontFamily: "Inter",
        fontSize: 10,
        fontWeight: "500",
        letterSpacing: 10 * 0.12,
        textTransform: "uppercase",
        color: error ? colors.danger : colors.textTertiary,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function TextField({
  value,
  onChange,
  prefix,
  error,
  autoCapitalize = "sentences",
  inputRef,
  onSubmitEditing,
  returnKeyType,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  error?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  inputRef?: RefObject<RNTextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done";
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? PARENT.accent
      : colors.borderSubtle;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        backgroundColor: focused ? "rgba(255,255,255,0.06)" : colors.surface2,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 10,
        paddingHorizontal: 14,
      }}
    >
      {prefix ? (
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 15,
            color: colors.textTertiary,
            marginRight: 2,
          }}
        >
          {prefix}
        </Text>
      ) : null}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={false}
        style={{
          flex: 1,
          fontFamily: "Inter",
          fontSize: 15,
          color: colors.textPrimary,
        }}
      />
    </View>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  onChange,
  icon,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${PARENT.accent}14`,
          borderWidth: 1,
          borderColor: `${PARENT.accent}30`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 14.5,
            fontWeight: "600",
            color: colors.textPrimary,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 12,
            color: colors.textTertiary,
            lineHeight: 17,
          }}
        >
          {sub}
        </Text>
      </View>
      <View
        style={{
          width: 42,
          height: 26,
          borderRadius: 999,
          backgroundColor: value ? PARENT.accent : "rgba(255,255,255,0.10)",
          flexShrink: 0,
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#fff",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}

function Segment({
  tab,
  setTab,
}: {
  tab: "profile" | "billing";
  setTab: (t: "profile" | "billing") => void;
}) {
  const tabs: { id: "profile" | "billing"; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "billing", label: "Billing" },
  ];
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 22,
        padding: 4,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 999,
        flexDirection: "row",
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            onPress={() => setTab(t.id)}
            style={{
              flex: 1,
              height: 38,
              backgroundColor: active ? PARENT.accent : "transparent",
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 13 * 0.02,
                color: active ? "#fff" : colors.textSecondary,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Screen ────────────────────────────────────────────────── */

export default function ManageChildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }>();
  const childId = params.id;

  const [tab, setTab] = useState<"profile" | "billing">("profile");
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState(params.firstName ?? "");
  const [lastName, setLastName] = useState(params.lastName ?? "");
  const [username, setUsername] = useState(params.username ?? "");
  const [dob, setDob] = useState<Date | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lockSettings, setLockSettings] = useState(false);

  const [regionOptions, setRegionOptions] = useState<SelectOption[]>([]);
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [saving, setSaving] = useState(false);

  const lastNameRef = useRef<RNTextInput>(null);
  const usernameRef = useRef<RNTextInput>(null);
  const dobRef = useRef<DateInputHandle>(null);

  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data)
          setRegionOptions(data.map((r) => ({ label: r.name, value: r.id })));
      });
  }, []);

  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    getChildProfile(childId).then((c) => {
      if (cancelled || !c) {
        if (!cancelled) setLoading(false);
        return;
      }
      setFirstName(c.firstName);
      setLastName(c.lastName);
      setUsername(c.username);
      setDob(c.dateOfBirth ? new Date(c.dateOfBirth) : null);
      setRegionId(c.regionId);
      setAvatarUrl(c.avatarUrl);
      setLockSettings(c.profileSettingsLocked);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "?";
  const age = ageFromDob(dob ? dob.toISOString().slice(0, 10) : null);

  async function handleSave() {
    if (!childId) return;
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setErrors({ username: !username.trim() ? "Required" : undefined });
      return;
    }
    setSaving(true);
    setErrors({});
    const result = await updateChildProfile({
      childProfileId: childId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      dateOfBirth: dob,
      regionId,
      profileSettingsLocked: lockSettings,
    });
    setSaving(false);

    if (!result.ok) {
      if (result.field === "username") {
        setErrors({ username: result.error });
      } else {
        Alert.alert("Error", result.error);
      }
      return;
    }
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[PARENT.headerTint, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: tab === "profile" ? 120 : 32 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 4 }}
        >
          <BackButton onPress={() => router.back()} label="Children" />
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              fontWeight: "900",
              color: colors.textPrimary,
              letterSpacing: -26 * 0.03,
            }}
          >
            Manage child
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.textTertiary}
            style={{ marginTop: 48 }}
          />
        ) : (
          <>
            {/* Identity card */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 18,
                marginBottom: 20,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                overflow: "hidden",
              }}
            >
              <Avatar
                role="player"
                size={58}
                initials={initials}
                imageUrl={avatarUrl}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 17,
                    fontWeight: "800",
                    color: colors.textPrimary,
                    letterSpacing: -17 * 0.02,
                  }}
                >
                  {firstName} {lastName}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {age != null ? `Age ${age} · ` : ""}@{username}
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  borderRadius: 999,
                  backgroundColor: "rgba(56,161,105,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(56,161,105,0.3)",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter",
                    fontSize: 9.5,
                    fontWeight: "700",
                    letterSpacing: 9.5 * 0.12,
                    color: colors.success,
                    textTransform: "uppercase",
                  }}
                >
                  Active
                </Text>
              </View>
            </View>

            <Segment tab={tab} setTab={setTab} />

            {tab === "profile" ? (
              <View style={{ paddingHorizontal: 20 }}>
                <SectionLabel>Personal</SectionLabel>
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}
                >
                  <View style={{ flex: 1 }}>
                    <FieldLabel>First name</FieldLabel>
                    <TextField
                      value={firstName}
                      onChange={setFirstName}
                      autoCapitalize="words"
                      returnKeyType="next"
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldLabel>Last name</FieldLabel>
                    <TextField
                      value={lastName}
                      onChange={setLastName}
                      autoCapitalize="words"
                      inputRef={lastNameRef}
                      returnKeyType="next"
                      onSubmitEditing={() => usernameRef.current?.focus()}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 14 }}>
                  <FieldLabel error={!!errors.username}>Username</FieldLabel>
                  <TextField
                    value={username}
                    onChange={(v) => {
                      setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setErrors({});
                    }}
                    prefix="@"
                    autoCapitalize="none"
                    inputRef={usernameRef}
                    error={!!errors.username}
                  />
                  {errors.username ? (
                    <Text
                      style={{
                        fontFamily: "Inter",
                        fontSize: 11,
                        color: colors.danger,
                        marginTop: 4,
                      }}
                    >
                      {errors.username}
                    </Text>
                  ) : null}
                </View>

                <View style={{ marginBottom: 14 }}>
                  <FieldLabel>Date of birth</FieldLabel>
                  <DateInput
                    ref={dobRef}
                    value={dob}
                    onChange={setDob}
                    maxDate={new Date()}
                    placeholder="DD/MM/YYYY"
                    accentColor={PARENT.accent}
                  />
                </View>

                <View style={{ marginBottom: 4 }}>
                  <FieldLabel>Region</FieldLabel>
                  <SelectInput
                    value={regionId}
                    options={regionOptions}
                    placeholder="Select region"
                    onChange={setRegionId}
                  />
                </View>

                <SectionLabel>Guardian controls</SectionLabel>
                <ToggleRow
                  title="Lock profile settings"
                  sub={`Stop ${firstName || "your child"} from editing their own profile.`}
                  value={lockSettings}
                  onChange={setLockSettings}
                  icon={<SettingsIcon size={18} color={PARENT.accent} />}
                />

                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: colors.surface2,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: `${PARENT.accent}14`,
                      borderWidth: 1,
                      borderColor: `${PARENT.accent}30`,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldIcon size={14} color={PARENT.accent} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "Inter",
                      fontSize: 12.5,
                      color: colors.textSecondary,
                      lineHeight: 19,
                    }}
                  >
                    You manage {firstName || "your child"}&apos;s account until
                    they turn 16. They&apos;ll be able to take it over with
                    their own login then.
                  </Text>
                </View>
              </View>
            ) : (
              <BillingPlaceholder firstName={firstName} />
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky save — profile tab only */}
      {!loading && tab === "profile" ? (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 36,
            paddingTop: 12,
          }}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={["transparent", colors.surface]}
            style={{
              position: "absolute",
              top: -20,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            pointerEvents="none"
          />
          <Pressable
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
            style={{
              height: 52,
              backgroundColor: saving ? `${PARENT.accent}80` : PARENT.accent,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                Save changes
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Billing tab (placeholder — full billing ships later) ───── */
function BillingPlaceholder({ firstName }: { firstName: string }) {
  const player = roleConfig("player");
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <SectionLabel>Current plan</SectionLabel>
      <View
        style={{
          backgroundColor: colors.surface2,
          borderWidth: 1.5,
          borderColor: `${PARENT.accent}55`,
          borderRadius: 18,
          padding: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 9.5,
              fontWeight: "700",
              letterSpacing: 9.5 * 0.14,
              color: PARENT.accent,
              textTransform: "uppercase",
            }}
          >
            {player.planName}
          </Text>
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 7,
              borderRadius: 999,
              backgroundColor: "rgba(56,161,105,0.14)",
              borderWidth: 1,
              borderColor: "rgba(56,161,105,0.3)",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 9 * 0.12,
                color: colors.success,
                textTransform: "uppercase",
              }}
            >
              Current
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: "900",
            color: colors.textPrimary,
            letterSpacing: -22 * 0.03,
            marginBottom: 4,
          }}
        >
          Standard
        </Text>
        <Text
          style={{
            fontFamily: "Inter",
            fontSize: 13,
            color: colors.textSecondary,
          }}
        >
          {player.planSub}
        </Text>
      </View>

      {/* Coming-soon note */}
      <View
        style={{
          marginTop: 16,
          backgroundColor: colors.surface2,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: 14,
          padding: 16,
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CreditIcon size={18} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 13.5,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 2,
            }}
          >
            Billing is coming soon
          </Text>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 12,
              color: colors.textTertiary,
              lineHeight: 18,
            }}
          >
            You&apos;ll be able to manage {firstName || "your child"}&apos;s
            plan, payment method, and renewals here.
          </Text>
        </View>
        <ChevronIcon size={16} color={colors.textDisabled} />
      </View>
    </View>
  );
}
