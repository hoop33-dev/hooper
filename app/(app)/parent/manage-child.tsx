import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { Avatar } from "@/src/components/dashboard/Avatar";
import {
  CameraIcon,
  ChevronIcon,
  CreditIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/src/components/dashboard/icons";
import { PhotoSourceSheet } from "@/src/components/profile/PhotoSourceSheet";
import { ErrorBanner } from "@/src/components/ui/ErrorBanner";
import { SelectInput } from "@/src/components/ui/SelectInput";
import { roleConfig } from "@/src/constants/roles";
import { colors, fonts} from "@/src/constants/theme";
import {
  useManageChildForm,
  type ManageChildForm,
} from "@/src/hooks/useManageChildForm";
import { useRegionOptions } from "@/src/hooks/useRegionOptions";
import { ageFromDob } from "@/src/lib/age";
import { uploadAvatar } from "@/src/services/profile.service";

const PARENT = roleConfig("parent");
type InputRef = RefObject<RNTextInput | null>;

/* ─── Primitives ────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.bodyBold,
        fontSize: 11,
        letterSpacing: 11 * 0.14,
        textTransform: "uppercase",
        color: colors.textSecondary,
        marginTop: 12,
        marginBottom: 14,
      }}>
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
        fontFamily: fonts.bodyMedium,
        fontSize: 10,
        letterSpacing: 10 * 0.12,
        textTransform: "uppercase",
        color: error ? colors.danger : colors.textTertiary,
        marginBottom: 6,
      }}>
      {children}
    </Text>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  error?: boolean;
  errorText?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  inputRef?: InputRef;
  onSubmit?: () => void;
  returnKeyType?: "next" | "done";
};

function Field({
  label,
  value,
  onChange,
  prefix,
  error,
  errorText,
  autoCapitalize = "sentences",
  inputRef,
  onSubmit,
  returnKeyType,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? PARENT.accent
      : colors.borderSubtle;
  return (
    <View>
      <FieldLabel error={error}>{label}</FieldLabel>
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
        }}>
        {prefix ? (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.textTertiary,
            }}>
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
          onSubmitEditing={onSubmit}
          returnKeyType={returnKeyType}
          blurOnSubmit={false}
          style={{
            flex: 1,
            fontFamily: fonts.body,
            fontSize: 15,
            color: colors.textPrimary,
          }}
        />
      </View>
      {errorText ? (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 11,
            color: colors.danger,
            marginTop: 4,
          }}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <View
      style={{
        width: 42,
        height: 26,
        borderRadius: 999,
        backgroundColor: on ? PARENT.accent : "rgba(255,255,255,0.10)",
        justifyContent: "center",
        paddingHorizontal: 3,
      }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#fff",
          alignSelf: on ? "flex-end" : "flex-start",
        }}
      />
    </View>
  );
}

/* ─── Header + segment ──────────────────────────────────────── */

function ManageHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 4 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
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
            fontFamily: fonts.bodyMedium,
            fontSize: 13,
            color: colors.textTertiary,
          }}>
          Children
        </Text>
      </Pressable>
      <Text
        style={{
          fontFamily: fonts.bodyMedium,
          fontSize: 26,
          color: colors.textPrimary,
          letterSpacing: -26 * 0.03,
        }}>
        Manage child
      </Text>
    </View>
  );
}

function ChildSegment({
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
      }}>
      {tabs.map((t) => (
        <Pressable
          key={t.id}
          accessibilityRole="button"
          onPress={() => setTab(t.id)}
          style={{
            flex: 1,
            height: 38,
            backgroundColor: tab === t.id ? PARENT.accent : "transparent",
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 13,
              color: tab === t.id ? "#fff" : colors.textSecondary,
            }}>
            {t.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function IdentityCard({
  initials,
  name,
  subtitle,
  avatarUrl,
}: {
  initials: string;
  name: string;
  subtitle: string;
  avatarUrl: string | null;
}) {
  return (
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
      }}>
      <Avatar
        role="player"
        size={58}
        initials={initials}
        imageUrl={avatarUrl}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.bodyExtraBold,
            fontSize: 17,
            color: colors.textPrimary,
            letterSpacing: -17 * 0.02,
          }}>
          {name}
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodyExtraBold,
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
          }}>
          {subtitle}
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
        }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 9.5,
            letterSpacing: 9.5 * 0.12,
            color: colors.success,
            textTransform: "uppercase",
          }}>
          Active
        </Text>
      </View>
    </View>
  );
}

/* ─── Avatar picker helpers (module-level, not component fns) ── */

type PickedImage = { uri: string; base64: string; mimeType: string };

async function pickImageFromLibrary(
  onError: (msg: string) => void,
): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    onError("Please allow access to your photo library in Settings.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    base64: true,
  });
  if (!result.canceled && result.assets[0]) {
    const a = result.assets[0];
    return {
      uri: a.uri,
      base64: a.base64 ?? "",
      mimeType: a.mimeType ?? "image/jpeg",
    };
  }
  return null;
}

async function pickImageFromCamera(
  onError: (msg: string) => void,
): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    onError("Please allow camera access in Settings.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
    base64: true,
  });
  if (!result.canceled && result.assets[0]) {
    const a = result.assets[0];
    return {
      uri: a.uri,
      base64: a.base64 ?? "",
      mimeType: a.mimeType ?? "image/jpeg",
    };
  }
  return null;
}

function AvatarEditor({
  initials,
  displayUri,
  onPress,
}: {
  initials: string;
  displayUri: string | null;
  onPress: () => void;
}) {
  return (
    <View style={{ alignItems: "center", paddingTop: 4, paddingBottom: 20 }}>
      <View style={{ position: "relative", marginBottom: 12 }}>
        {displayUri ? (
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              overflow: "hidden",
            }}>
            <Image
              source={{ uri: displayUri }}
              style={{ width: 84, height: 84 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <Avatar role="player" size={84} initials={initials} />
        )}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: PARENT.accent,
            borderWidth: 3,
            borderColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <CameraIcon size={14} color="#fff" />
        </Pressable>
      </View>
      <Pressable onPress={onPress} accessibilityRole="button">
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 12,
            color: PARENT.accent,
            borderWidth: 1,
            borderColor: `${PARENT.accent}40`,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
          }}>
          Change photo
        </Text>
      </Pressable>
    </View>
  );
}

/* ─── Profile tab ───────────────────────────────────────────── */

function PersonalFields({
  form,
  regionOptions,
  lastNameRef,
  usernameRef,
}: {
  form: ManageChildForm;
  regionOptions: { value: string; label: string }[];
  lastNameRef: InputRef;
  usernameRef: InputRef;
}) {
  return (
    <>
      <SectionLabel>Personal</SectionLabel>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="First name"
            value={form.firstName}
            onChange={form.setFirstName}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmit={() => lastNameRef.current?.focus()}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Last name"
            value={form.lastName}
            onChange={form.setLastName}
            autoCapitalize="words"
            inputRef={lastNameRef}
            returnKeyType="next"
            onSubmit={() => usernameRef.current?.focus()}
          />
        </View>
      </View>
      <View style={{ marginBottom: 14 }}>
        <Field
          label="Username"
          prefix="@"
          value={form.username}
          onChange={(v) => {
            form.setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
            form.setUsernameError(undefined);
          }}
          autoCapitalize="none"
          inputRef={usernameRef}
          error={!!form.usernameError}
          errorText={form.usernameError}
        />
      </View>
      <View>
        <FieldLabel>Region</FieldLabel>
        <SelectInput
          value={form.regionId}
          options={regionOptions}
          placeholder="Select region"
          onChange={form.setRegionId}
        />
      </View>
    </>
  );
}

function GuardianSection({
  value,
  onChange,
  childName,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  childName: string;
}) {
  return (
    <>
      <SectionLabel>Guardian controls</SectionLabel>
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
        }}>
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
          }}>
          <SettingsIcon size={18} color={PARENT.accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontFamily: fonts.bodySemi,
              fontSize: 14.5,
              color: colors.textPrimary,
              marginBottom: 2,
            }}>
            Lock profile settings
          </Text>
          <Text
            style={{
              fontFamily: fonts.bodySemi,
              fontSize: 12,
              color: colors.textTertiary,
            }}>
            Stop {childName || "your child"} from editing their own profile.
          </Text>
        </View>
        <Switch on={value} />
      </Pressable>
      <ShieldNote childName={childName} />
    </>
  );
}

function ShieldNote({ childName }: { childName: string }) {
  return (
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
      }}>
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
        }}>
        <ShieldIcon size={14} color={PARENT.accent} />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.body,
          fontSize: 12.5,
          color: colors.textSecondary,
          lineHeight: 19,
        }}>
        You manage {childName || "your child"}&apos;s account until they turn
        16.
      </Text>
    </View>
  );
}

function ProfileTab({
  form,
  regionOptions,
  lastNameRef,
  usernameRef,
  initials,
  displayAvatarUri,
  onChangePhoto,
}: {
  form: ManageChildForm;
  regionOptions: { value: string; label: string }[];
  lastNameRef: InputRef;
  usernameRef: InputRef;
  initials: string;
  displayAvatarUri: string | null;
  onChangePhoto: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <AvatarEditor
        initials={initials}
        displayUri={displayAvatarUri}
        onPress={onChangePhoto}
      />
      <PersonalFields
        form={form}
        regionOptions={regionOptions}
        lastNameRef={lastNameRef}
        usernameRef={usernameRef}
      />
      <GuardianSection
        value={form.lock}
        onChange={form.setLock}
        childName={form.firstName}
      />
    </View>
  );
}

/* ─── Billing tab (placeholder — full billing ships later) ───── */

function BillingPlanCard() {
  const player = roleConfig("player");
  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderWidth: 1.5,
        borderColor: `${PARENT.accent}55`,
        borderRadius: 18,
        padding: 18,
      }}>
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 9.5,
          letterSpacing: 9.5 * 0.14,
          color: PARENT.accent,
          textTransform: "uppercase",
          marginBottom: 4,
        }}>
        {player.planName}
      </Text>
      <Text
        style={{
          fontFamily: fonts.headingBlack,
          fontSize: 22,
          color: colors.textPrimary,
          letterSpacing: -22 * 0.03,
          marginBottom: 4,
        }}>
        Standard
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textSecondary,
        }}>
        {player.planSub}
      </Text>
    </View>
  );
}

function BillingComingSoon({ firstName }: { firstName: string }) {
  return (
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
      }}>
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
        }}>
        <CreditIcon size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 13.5,
            color: colors.textPrimary,
            marginBottom: 2,
          }}>
          Billing is coming soon
        </Text>
        <Text
          style={{
            fontFamily: fonts.bodySemi,
            fontSize: 12,
            color: colors.textTertiary,
            lineHeight: 18,
          }}>
          You&apos;ll be able to manage {firstName || "your child"}&apos;s plan,
          payment method, and renewals here.
        </Text>
      </View>
      <ChevronIcon size={16} color={colors.textDisabled} />
    </View>
  );
}

function BillingTab({ firstName }: { firstName: string }) {
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <SectionLabel>Current plan</SectionLabel>
      <BillingPlanCard />
      <BillingComingSoon firstName={firstName} />
    </View>
  );
}

function SaveBar({
  onPress,
  saving,
  error,
}: {
  onPress: () => void;
  saving: boolean;
  error?: string | null;
}) {
  return (
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
      pointerEvents="box-none">
      <LinearGradient
        colors={["transparent", colors.surface]}
        style={{ position: "absolute", top: -20, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
      {error ? (
        <View style={{ marginBottom: 10 }}>
          <ErrorBanner message={error} />
        </View>
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={saving}
        accessibilityRole="button"
        style={{
          height: 52,
          backgroundColor: saving ? `${PARENT.accent}80` : PARENT.accent,
          borderRadius: 9999,
          alignItems: "center",
          justifyContent: "center",
        }}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 15,
              color: "#fff",
            }}>
            Save changes
          </Text>
        )}
      </Pressable>
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
  const [tab, setTab] = useState<"profile" | "billing">("profile");
  const form = useManageChildForm(params.id);
  const regionOptions = useRegionOptions();
  const lastNameRef = useRef<RNTextInput>(null);
  const usernameRef = useRef<RNTextInput>(null);

  const [pendingImage, setPendingImage] = useState<PickedImage | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handlePickLibrary() {
    setPhotoSheetVisible(false);
    const img = await pickImageFromLibrary(setSaveError);
    if (img) setPendingImage(img);
  }

  async function handlePickCamera() {
    setPhotoSheetVisible(false);
    const img = await pickImageFromCamera(setSaveError);
    if (img) setPendingImage(img);
  }

  async function handleSave() {
    setSaveError(null);
    let avatarUrl: string | undefined;
    if (pendingImage && params.id) {
      try {
        avatarUrl = await uploadAvatar(
          params.id,
          pendingImage.base64,
          pendingImage.mimeType,
        );
      } catch {
        setSaveError("Failed to upload photo. Please try again.");
        return;
      }
    }
    const res = await form.save(avatarUrl);
    if (res.ok) {
      router.back();
    } else if (res.alert) {
      setSaveError(res.alert);
    }
  }

  const name =
    `${form.firstName} ${form.lastName}`.trim() || (params.firstName ?? "");
  const initials =
    (form.firstName.charAt(0) + form.lastName.charAt(0)).toUpperCase() || "?";
  const age = ageFromDob(form.dob);
  const subtitle = `${age != null ? `Age ${age} · ` : ""}@${form.username}`;
  const displayAvatarUri = pendingImage?.uri ?? form.avatarUrl;

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
        contentContainerStyle={{ paddingBottom: tab === "profile" ? (saveError ? 184 : 120) : 32 }}
        style={{ flex: 1 }}>
        <ManageHeader onBack={() => router.back()} />
        {form.loading ? (
          <ActivityIndicator
            color={colors.textTertiary}
            style={{ marginTop: 48 }}
          />
        ) : (
          <>
            <IdentityCard
              initials={initials}
              name={name}
              subtitle={subtitle}
              avatarUrl={form.avatarUrl}
            />
            <ChildSegment tab={tab} setTab={setTab} />
            {tab === "profile" ? (
              <ProfileTab
                form={form}
                regionOptions={regionOptions}
                lastNameRef={lastNameRef}
                usernameRef={usernameRef}
                initials={initials}
                displayAvatarUri={displayAvatarUri}
                onChangePhoto={() => setPhotoSheetVisible(true)}
              />
            ) : (
              <BillingTab firstName={form.firstName} />
            )}
          </>
        )}
      </ScrollView>
      {!form.loading && tab === "profile" ? (
        <SaveBar onPress={handleSave} saving={form.saving} error={saveError} />
      ) : null}
      <PhotoSourceSheet
        visible={photoSheetVisible}
        accent={PARENT.accent}
        onCamera={handlePickCamera}
        onLibrary={handlePickLibrary}
        onCancel={() => setPhotoSheetVisible(false)}
      />
    </View>
  );
}
