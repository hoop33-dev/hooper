import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  type TextInput as RNTextInput,
} from "react-native";

import { GuardianBanner, GuardianLockPopup } from "@/src/components/dashboard";
import {
  CheckIcon,
  LockIcon,
  UserIcon,
} from "@/src/components/dashboard/icons";
import { AvatarEditor } from "@/src/components/profile/AvatarEditor";
import { PhotoSourceSheet } from "@/src/components/profile/PhotoSourceSheet";
import {
  AccentButton,
  Caption,
  ExitGuardSheet,
  Field,
  Label,
  Overline,
  ScreenHeader,
  SelectInput,
  StickySaveBar,
  ToggleRow,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { useExitGuard } from "@/src/hooks/useExitGuard";
import { useGuardianControls } from "@/src/hooks/useGuardianControls";
import { useRegionOptions } from "@/src/hooks/useRegionOptions";
import { checkUsernameAvailable } from "@/src/services/auth.service";
import { updateProfile, uploadAvatar } from "@/src/services/profile.service";
import { useAuthStore } from "@/src/stores/auth.store";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const user = useDashboardUser();
  const { profile, refreshProfile } = useAuthStore();
  const role = user?.role ?? "player";
  const r = roleConfig(role);

  // A guardian-managed child can't edit their own profile when locked.
  const guardian = useGuardianControls(role === "player");
  const locked = guardian.isManaged && guardian.profileSettingsLocked;
  const [showLock, setShowLock] = useState(false);

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

  // Photo-source sheet
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Region options (UUID value + display label) for the select input.
  const regionOptions = useRegionOptions();

  const lastNameRef = useRef<RNTextInput>(null);
  const usernameRef = useRef<RNTextInput>(null);

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

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setSaveError("Please allow access to your photo library in Settings.");
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

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setSaveError("Please allow camera access in Settings.");
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
    setSaveError(null);
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
          setSaveError(result.error);
        }
        return;
      }

      await refreshProfile();
      exitGuard.allowLeave();
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setSaveError(message);
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

  // Disable the iOS swipe-back gesture while there are unsaved changes so the
  // pop can't bypass the confirmation below.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isDirty });
  }, [navigation, isDirty]);

  // Guard every way off this screen while there are unsaved changes — the
  // custom back button, the Android hardware back button, and iOS edge-swipe
  // all surface as `beforeRemove`.
  const exitGuard = useExitGuard(isDirty && !saving);

  // Username suffix indicator
  const usernameSuffix =
    usernameStatus === "checking" ? (
      <ActivityIndicator size="small" color={colors.textTertiary} />
    ) : usernameStatus === "available" ? (
      <CheckIcon size={14} color={colors.success} />
    ) : usernameStatus === "taken" ? (
      <Caption className="text-danger">Taken</Caption>
    ) : null;

  // Avatar display: show pending local preview or saved URL or initials
  const displayAvatarUrl = pendingImageUri ?? user?.avatarUrl ?? null;

  return (
    <View className="bg-surface flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: saveError ? 184 : 120 }}
        className="flex-1">
        <ScreenHeader
          title="Profile settings"
          backLabel="Profile"
          onBack={() => router.back()}
        />

        {locked ? <GuardianBanner kind="profile" /> : null}

        <View className="relative">
          <View
            pointerEvents={locked ? "none" : "auto"}
            style={{ opacity: locked ? 0.5 : 1 }}>
            {/* Avatar editor */}
            <View className="items-center px-5 py-7">
              <AvatarEditor
                role={role}
                initials={user?.initials ?? "?"}
                displayUri={displayAvatarUrl}
                accent={r.accent}
                size={92}
                uploading={uploadingPhoto}
                onPress={handleChangePhoto}
              />
            </View>

            {/* Form */}
            <View className="px-5">
              <Overline className="mt-3 mb-3.5">Personal</Overline>

              {/* First / Last name row */}
              <View className="mb-3 flex-row gap-2.5">
                <View className="flex-1">
                  <Field
                    label="First name"
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
                <View className="flex-1">
                  <Field
                    label="Last name"
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
              <View className="mb-3">
                <Field
                  label="Username"
                  value={username}
                  onChange={handleUsernameChange}
                  prefix="@"
                  suffix={usernameSuffix}
                  accent={r.accent}
                  error={!!errors.username}
                  errorText={errors.username}
                  autoCapitalize="none"
                  inputRef={usernameRef}
                  returnKeyType="next"
                />
              </View>

              {/* Region */}
              <View className="mb-3">
                <Label className="mb-1.5">Region</Label>
                <SelectInput
                  value={regionId}
                  options={regionOptions}
                  placeholder="Select region"
                  onChange={setRegionId}
                />
              </View>

              {/* Bio */}
              <View className="mb-1">
                <Field
                  label="Bio"
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
              <Overline className="mt-3 mb-3.5">Privacy</Overline>

              <View className="gap-2">
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
          </View>
          {locked ? (
            <Pressable
              onPress={() => setShowLock(true)}
              accessibilityRole="button"
              accessibilityLabel="Settings locked by guardian"
              className="absolute inset-0"
            />
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky save button */}
      <StickySaveBar error={saveError}>
        {locked ? (
          <AccentButton
            variant="muted"
            accent={r.accent}
            icon={<LockIcon size={15} color={colors.textSecondary} />}
            onPress={() => setShowLock(true)}>
            Locked by guardian
          </AccentButton>
        ) : (
          <AccentButton accent={r.accent} loading={saving} onPress={handleSave}>
            {saving ? <ActivityIndicator color="#fff" /> : "Save changes"}
          </AccentButton>
        )}
      </StickySaveBar>

      <PhotoSourceSheet
        visible={photoSheetVisible}
        accent={r.accent}
        onCamera={pickFromCamera}
        onLibrary={pickFromLibrary}
        onCancel={() => setPhotoSheetVisible(false)}
      />

      <ExitGuardSheet
        visible={exitGuard.visible}
        title="Discard changes?"
        message="You have unsaved changes. If you leave now, they'll be lost."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        confirmAccent={colors.danger}
        onConfirm={exitGuard.confirmExit}
        onCancel={exitGuard.cancelExit}
      />

      <GuardianLockPopup
        visible={showLock}
        onClose={() => setShowLock(false)}
        kind="profile"
      />
    </View>
  );
}
