import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  type TextInput as RNTextInput,
} from "react-native";

import { Avatar } from "@/src/components/dashboard/Avatar";
import {
  ChevronIcon,
  CreditIcon,
  SettingsIcon,
  ShieldIcon,
} from "@/src/components/dashboard/icons";
import { AvatarEditor } from "@/src/components/profile/AvatarEditor";
import { PhotoSourceSheet } from "@/src/components/profile/PhotoSourceSheet";
import {
  AccentButton,
  Badge,
  BodySm,
  Caption,
  Field,
  IconTile,
  Label,
  Overline,
  RowTitle,
  ScreenHeader,
  ScreenTitle,
  SegmentedControl,
  SelectInput,
  StickySaveBar,
  Title,
  ToggleRow,
} from "@/src/components/ui";
import { roleConfig } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";
import {
  useManageChildForm,
  type ManageChildForm,
} from "@/src/hooks/useManageChildForm";
import { useRegionOptions } from "@/src/hooks/useRegionOptions";
import { ageFromDob } from "@/src/lib/age";
import { uploadAvatar } from "@/src/services/profile.service";

const PARENT = roleConfig("parent");
type InputRef = RefObject<RNTextInput | null>;

/* ─── Identity + tabs ───────────────────────────────────────── */

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
    <View className="border-border-subtle bg-surface-2 mx-5 mt-[18px] mb-5 flex-row items-center gap-3.5 rounded-2xl border p-4">
      <Avatar
        role="player"
        size={58}
        initials={initials}
        imageUrl={avatarUrl}
      />
      <View className="min-w-0 flex-1">
        <Title>{name}</Title>
        <Caption className="text-text-secondary mt-0.5">{subtitle}</Caption>
      </View>
      <Badge variant="green">Active</Badge>
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
      <Overline className="mt-3 mb-3.5">Personal</Overline>
      <View className="mb-3.5 flex-row gap-2.5">
        <View className="flex-1">
          <Field
            label="First name"
            value={form.firstName}
            onChange={form.setFirstName}
            accent={PARENT.accent}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>
        <View className="flex-1">
          <Field
            label="Last name"
            value={form.lastName}
            onChange={form.setLastName}
            accent={PARENT.accent}
            autoCapitalize="words"
            inputRef={lastNameRef}
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />
        </View>
      </View>
      <View className="mb-3.5">
        <Field
          label="Username"
          prefix="@"
          value={form.username}
          onChange={(v) => {
            form.setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
            form.setUsernameError(undefined);
          }}
          accent={PARENT.accent}
          autoCapitalize="none"
          inputRef={usernameRef}
          error={!!form.usernameError}
          errorText={form.usernameError}
        />
      </View>
      <View>
        <Label className="mb-1.5">Region</Label>
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
      <Overline className="mt-3 mb-3.5">Guardian controls</Overline>
      <ToggleRow
        title="Lock profile settings"
        sub={`Stop ${childName || "your child"} from editing their own profile.`}
        value={value}
        onChange={onChange}
        accent={PARENT.accent}
        icon={<SettingsIcon size={18} color={PARENT.accent} />}
      />
      <ShieldNote childName={childName} />
    </>
  );
}

function ShieldNote({ childName }: { childName: string }) {
  return (
    <View className="border-border-subtle bg-surface-2 mt-4 flex-row items-start gap-3 rounded-xl border p-4">
      <IconTile color={PARENT.accent} size={28} radius={8}>
        <ShieldIcon size={14} color={PARENT.accent} />
      </IconTile>
      <BodySm className="text-text-secondary flex-1">
        You manage {childName || "your child"}&apos;s account until they turn
        16.
      </BodySm>
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
    <View className="px-5">
      <View className="pt-1 pb-5">
        <AvatarEditor
          role="player"
          initials={initials}
          displayUri={displayAvatarUri}
          accent={PARENT.accent}
          size={84}
          onPress={onChangePhoto}
        />
      </View>
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
      className="bg-surface-2 rounded-[18px] border-[1.5px] p-[18px]"
      style={{ borderColor: `${PARENT.accent}55` }}>
      <Overline className="mb-1" style={{ color: PARENT.accent }}>
        {player.planName}
      </Overline>
      <ScreenTitle className="mb-1">Standard</ScreenTitle>
      <BodySm>{player.planSub}</BodySm>
    </View>
  );
}

function BillingComingSoon({ firstName }: { firstName: string }) {
  return (
    <View className="border-border-subtle bg-surface-2 mt-4 flex-row items-start gap-3 rounded-2xl border p-4">
      <View className="border-border-subtle h-[38px] w-[38px] items-center justify-center rounded-[10px] border bg-white/5">
        <CreditIcon size={18} color={colors.textSecondary} />
      </View>
      <View className="min-w-0 flex-1">
        <RowTitle>Billing is coming soon</RowTitle>
        <Caption className="mt-0.5">
          You&apos;ll be able to manage {firstName || "your child"}&apos;s plan,
          payment method, and renewals here.
        </Caption>
      </View>
      <ChevronIcon size={16} color={colors.textDisabled} />
    </View>
  );
}

function BillingTab({ firstName }: { firstName: string }) {
  return (
    <View className="px-5">
      <Overline className="mt-3 mb-3.5">Current plan</Overline>
      <BillingPlanCard />
      <BillingComingSoon firstName={firstName} />
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
    <View className="bg-surface flex-1">
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
        contentContainerStyle={{
          paddingBottom: tab === "profile" ? (saveError ? 184 : 120) : 32,
        }}
        className="flex-1">
        <ScreenHeader
          title="Manage child"
          backLabel="Children"
          onBack={() => router.back()}
        />
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
            <SegmentedControl
              segments={[
                { id: "profile", label: "Profile" },
                { id: "billing", label: "Billing" },
              ]}
              value={tab}
              onChange={setTab}
              accent={PARENT.accent}
              className="mx-5 mb-[22px]"
            />
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
        <StickySaveBar error={saveError}>
          <AccentButton
            accent={PARENT.accent}
            loading={form.saving}
            onPress={handleSave}>
            {form.saving ? <ActivityIndicator color="#fff" /> : "Save changes"}
          </AccentButton>
        </StickySaveBar>
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
