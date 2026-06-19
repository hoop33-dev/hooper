import {
  type ReactNode,
  type RefObject,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";

import { Avatar } from "@/src/components/dashboard/Avatar";
import { SelectInput } from "@/src/components/ui/SelectInput";
import {
  CameraIcon,
  CheckIcon,
  LockIcon,
  UserIcon,
} from "@/src/components/dashboard/icons";
import { colors } from "@/src/constants/theme";
import { roleConfig } from "@/src/constants/roles";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useAuthStore } from "@/src/stores/auth.store";
import { checkUsernameAvailable } from "@/src/services/auth.service";
import { updateProfile, uploadAvatar } from "@/src/services/profile.service";
import { supabase } from "@/src/lib/supabase";
import type { SelectOption } from "@/src/components/ui/SelectInput";
import Svg, { Path } from "react-native-svg";

/* ─── Sub-components ───────────────────────────────────────── */

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
        Profile
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

type TextFieldProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: ReactNode;
  accent: string;
  multiline?: boolean;
  numberOfLines?: number;
  error?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  inputRef?: RefObject<RNTextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done" | "go";
};

function TextField({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  accent,
  multiline,
  numberOfLines,
  error,
  autoCapitalize = "sentences",
  inputRef,
  onSubmitEditing,
  returnKeyType,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? accent
      : colors.borderSubtle;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        minHeight: multiline ? undefined : 48,
        backgroundColor: focused ? "rgba(255,255,255,0.06)" : colors.surface2,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
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
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={!multiline}
        style={{
          flex: 1,
          fontFamily: "Inter",
          fontSize: 15,
          color: colors.textPrimary,
          textAlignVertical: multiline ? "top" : "center",
          minHeight: multiline ? (numberOfLines ? numberOfLines * 22 : 66) : 48,
        }}
      />
      {suffix ? <View style={{ marginLeft: 8 }}>{suffix}</View> : null}
    </View>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  onChange,
  accent,
  icon,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
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
        padding: 14,
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
          backgroundColor: `${accent}14`,
          borderWidth: 1,
          borderColor: `${accent}30`,
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
      {/* Toggle pill */}
      <View
        style={{
          width: 42,
          height: 26,
          borderRadius: 999,
          backgroundColor: value ? accent : "rgba(255,255,255,0.10)",
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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }}
        />
      </View>
    </Pressable>
  );
}

function ImageIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5.5A2.5 2.5 0 015.5 3h13A2.5 2.5 0 0121 5.5v13A2.5 2.5 0 0118.5 21h-13A2.5 2.5 0 013 18.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M21 15l-4.5-4.5L6 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** A single tappable row inside a bottom-sheet modal. */
function SheetOption({
  icon,
  label,
  accent,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  accent: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? "rgba(255,255,255,0.06)" : colors.surface2,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        borderRadius: 14,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `${accent}14`,
          borderWidth: 1,
          borderColor: `${accent}30`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 15,
          fontWeight: "600",
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Bottom-sheet asking the user where to source their photo from. */
function PhotoSourceSheet({
  visible,
  accent,
  onCamera,
  onLibrary,
  onCancel,
}: {
  visible: boolean;
  accent: string;
  onCamera: () => void;
  onLibrary: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.72)",
        }}
      >
        <Pressable
          // Swallow taps inside the sheet so they don't dismiss it.
          onPress={() => {}}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.18)",
                marginBottom: 18,
              }}
            />
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "800",
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              Change photo
            </Text>
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 13,
                color: colors.textTertiary,
                marginBottom: 18,
              }}
            >
              Choose where to get your new profile photo.
            </Text>

            <View style={{ gap: 8 }}>
              <SheetOption
                icon={<CameraIcon size={18} color={accent} />}
                label="Take photo"
                accent={accent}
                onPress={onCamera}
              />
              <SheetOption
                icon={<ImageIcon size={18} color={accent} />}
                label="Choose from library"
                accent={accent}
                onPress={onLibrary}
              />
            </View>

            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={{
                height: 50,
                marginTop: 14,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: "700",
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Confirmation shown when leaving the screen with unsaved edits. */
function DiscardChangesModal({
  visible,
  accent,
  onDiscard,
  onKeepEditing,
}: {
  visible: boolean;
  accent: string;
  onDiscard: () => void;
  onKeepEditing: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepEditing}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 28,
          backgroundColor: "rgba(0,0,0,0.72)",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 360,
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 19,
              fontWeight: "800",
              color: colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Discard changes?
          </Text>
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              lineHeight: 14 * 1.5,
              color: colors.textSecondary,
              marginBottom: 22,
            }}
          >
            You have unsaved changes. If you leave now, they&apos;ll be lost.
          </Text>

          <Pressable
            onPress={onDiscard}
            accessibilityRole="button"
            style={{
              height: 50,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.danger,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "700",
                color: "#fff",
              }}
            >
              Discard changes
            </Text>
          </Pressable>
          <Pressable
            onPress={onKeepEditing}
            accessibilityRole="button"
            style={{
              height: 50,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: `${accent}40`,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              Keep editing
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main screen ──────────────────────────────────────────── */

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const user = useDashboardUser();
  const { profile, refreshProfile } = useAuthStore();
  const role = user?.role ?? "player";
  const r = roleConfig(role);

  // Form state initialised from current profile data
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [regionId, setRegionId] = useState<string | null>(
    user?.regionId ?? null,
  );
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate ?? false);
  const [showAge, setShowAge] = useState(user?.showAge ?? true);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(
    null,
  );
  const [pendingMimeType, setPendingMimeType] = useState<string>("image/jpeg");

  // Photo-source sheet + unsaved-changes guard
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);

  // Username async validation
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [regionOptions, setRegionOptions] = useState<SelectOption[]>([]);

  const lastNameRef = useRef<RNTextInput>(null);
  const usernameRef = useRef<RNTextInput>(null);

  // Fetch regions from DB so option values are UUIDs matching profiles.region_id
  useEffect(() => {
    supabase
      .from("regions")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setRegionOptions(data.map((r) => ({ label: r.name, value: r.id })));
        }
      });
  }, []);

  // Re-init if profile loads after mount
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setUsername(user.username);
    setRegionId(user.regionId);
    setBio(user.bio ?? "");
    setIsPrivate(user.isPrivate);
    setShowAge(user.showAge);
  }, [profile?.id]);

  // Validate username as user types (skip if unchanged)
  function handleUsernameChange(v: string) {
    const normalised = v.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalised);
    setErrors((e) => ({ ...e, username: undefined }));

    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

    if (!normalised || normalised === user?.username) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    usernameDebounceRef.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(normalised);
      if (available === null) {
        setUsernameStatus("error");
      } else {
        setUsernameStatus(available ? "available" : "taken");
      }
    }, 500);
  }

  // Avatar: open our custom source picker
  function handleChangePhoto() {
    setPhotoSheetVisible(true);
  }

  async function pickFromLibrary() {
    setPhotoSheetVisible(false);
     
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = require("expo-image-picker");
    } catch {
      Alert.alert("Not available", "Photo upload requires an app update.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library in Settings.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImageUri(asset.uri);
      setPendingImageBase64(asset.base64 ?? null);
      setPendingMimeType(asset.mimeType ?? "image/jpeg");
    }
  }

  async function pickFromCamera() {
    setPhotoSheetVisible(false);
     
    let ImagePicker: typeof import("expo-image-picker");
    try {
      ImagePicker = require("expo-image-picker");
    } catch {
      Alert.alert("Not available", "Photo upload requires an app update.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow camera access in Settings.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImageUri(asset.uri);
      setPendingImageBase64(asset.base64 ?? null);
      setPendingMimeType(asset.mimeType ?? "image/jpeg");
    }
  }

  // Validation
  function validate(): boolean {
    const errs: typeof errors = {};
    if (!firstName.trim()) errs.firstName = "Required";
    if (!lastName.trim()) errs.lastName = "Required";
    if (!username.trim()) {
      errs.username = "Required";
    } else if (usernameStatus === "taken") {
      errs.username = "That username is already taken.";
    } else if (usernameStatus === "checking") {
      errs.username = "Checking availability…";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !profile) return;
    setSaving(true);
    try {
      // Upload new photo if selected
      let newAvatarUrl = profile.avatar_url ?? null;
      if (pendingImageBase64) {
        setUploadingPhoto(true);
        newAvatarUrl = await uploadAvatar(
          profile.id,
          pendingImageBase64,
          pendingMimeType,
        );
        setUploadingPhoto(false);
      }

      const result = await updateProfile(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        region_id: regionId,
        bio: bio.trim() || null,
        is_private: isPrivate,
        show_age: showAge,
        avatar_url: newAvatarUrl,
      });

      if (!result.ok) {
        if (result.field === "username") {
          setErrors({ username: result.error });
        } else {
          Alert.alert("Error", result.error);
        }
        return;
      }

      await refreshProfile();
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  }

  // Dirty detection — true when the form differs from the saved profile.
  const isDirty =
    firstName !== (user?.firstName ?? "") ||
    lastName !== (user?.lastName ?? "") ||
    username !== (user?.username ?? "") ||
    regionId !== (user?.regionId ?? null) ||
    bio !== (user?.bio ?? "") ||
    isPrivate !== (user?.isPrivate ?? false) ||
    showAge !== (user?.showAge ?? true) ||
    pendingImageUri !== null;

  // Guarded navigation: prompt before discarding unsaved edits.
  const handleBack = useCallback(() => {
    if (isDirty && !saving) {
      setDiscardVisible(true);
    } else {
      router.back();
    }
  }, [isDirty, saving, router]);

  // Intercept the Android hardware back button while editing.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (isDirty && !saving) {
          setDiscardVisible(true);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [isDirty, saving]),
  );

  // Username suffix indicator
  const usernameSuffix =
    usernameStatus === "checking" ? (
      <ActivityIndicator size="small" color={colors.textTertiary} />
    ) : usernameStatus === "available" ? (
      <CheckIcon size={14} color={colors.success} />
    ) : usernameStatus === "taken" ? (
      <Text style={{ fontFamily: "Inter", fontSize: 11, color: colors.danger }}>
        Taken
      </Text>
    ) : null;

  // Avatar display: show pending local preview or saved URL or initials
  const displayAvatarUrl = pendingImageUri ?? user?.avatarUrl ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <LinearGradient
        colors={[r.headerTint, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 320,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 4 }}
        >
          <BackButton onPress={handleBack} />
          <Text
            style={{
              fontFamily: "Inter",
              fontSize: 26,
              fontWeight: "900",
              color: colors.textPrimary,
              letterSpacing: -26 * 0.03,
            }}
          >
            Profile settings
          </Text>
        </View>

        {/* Avatar editor */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 28,
            paddingBottom: 28,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ position: "relative", marginBottom: 12 }}>
            {displayAvatarUrl ? (
              <View
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: displayAvatarUrl }}
                  style={{ width: 92, height: 92 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <Avatar role={role} size={92} initials={user?.initials ?? "?"} />
            )}
            <Pressable
              onPress={handleChangePhoto}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: r.accent,
                borderWidth: 3,
                borderColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: r.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <CameraIcon size={15} color="#fff" />
              )}
            </Pressable>
          </View>
          <Pressable onPress={handleChangePhoto} accessibilityRole="button">
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 12,
                fontWeight: "700",
                color: r.accent,
                borderWidth: 1,
                borderColor: `${r.accent}40`,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                letterSpacing: 12 * 0.02,
              }}
            >
              Change photo
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: 20 }}>
          <SectionLabel>Personal</SectionLabel>

          {/* First / Last name row */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <FieldLabel error={!!errors.firstName}>First name</FieldLabel>
              <TextField
                value={firstName}
                onChange={(v) => {
                  setFirstName(v);
                  setErrors((e) => ({ ...e, firstName: undefined }));
                }}
                accent={r.accent}
                error={!!errors.firstName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel error={!!errors.lastName}>Last name</FieldLabel>
              <TextField
                value={lastName}
                onChange={(v) => {
                  setLastName(v);
                  setErrors((e) => ({ ...e, lastName: undefined }));
                }}
                accent={r.accent}
                error={!!errors.lastName}
                autoCapitalize="words"
                inputRef={lastNameRef}
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
              />
            </View>
          </View>

          {/* Username */}
          <View style={{ marginBottom: 12 }}>
            <FieldLabel error={!!errors.username}>Username</FieldLabel>
            <TextField
              value={username}
              onChange={handleUsernameChange}
              prefix="@"
              suffix={usernameSuffix}
              accent={r.accent}
              error={!!errors.username}
              autoCapitalize="none"
              inputRef={usernameRef}
              returnKeyType="next"
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

          {/* Region */}
          <View style={{ marginBottom: 12 }}>
            <FieldLabel>Region</FieldLabel>
            <SelectInput
              value={regionId}
              options={regionOptions}
              placeholder="Select region"
              onChange={setRegionId}
            />
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 4 }}>
            <FieldLabel>Bio</FieldLabel>
            <TextField
              value={bio}
              onChange={setBio}
              placeholder="Tell people about yourself…"
              accent={r.accent}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </View>

          {/* Privacy section */}
          <SectionLabel>Privacy</SectionLabel>

          <View style={{ gap: 8 }}>
            <ToggleRow
              title="Private profile"
              sub={
                isPrivate
                  ? "Only approved followers can see your activity."
                  : "Anyone on Hooper can see your activity."
              }
              value={isPrivate}
              onChange={setIsPrivate}
              accent={r.accent}
              icon={<LockIcon size={18} color={r.accent} />}
            />
            <ToggleRow
              title="Show age"
              sub="Display your age on your public profile."
              value={showAge}
              onChange={setShowAge}
              accent={r.accent}
              icon={<UserIcon size={18} color={r.accent} />}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky save button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: 36,
          paddingTop: 12,
          backgroundColor: "transparent",
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
            backgroundColor: saving ? `${r.accent}80` : r.accent,
            borderRadius: 9999,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: r.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: saving ? 0 : 0.45,
            shadowRadius: 16,
            elevation: 6,
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

      <PhotoSourceSheet
        visible={photoSheetVisible}
        accent={r.accent}
        onCamera={pickFromCamera}
        onLibrary={pickFromLibrary}
        onCancel={() => setPhotoSheetVisible(false)}
      />

      <DiscardChangesModal
        visible={discardVisible}
        accent={r.accent}
        onKeepEditing={() => setDiscardVisible(false)}
        onDiscard={() => {
          setDiscardVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
