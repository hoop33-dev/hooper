import { ActivityIndicator, Image, Pressable, View } from "react-native";

import { Avatar } from "@/src/components/dashboard/Avatar";
import { CameraIcon } from "@/src/components/dashboard/icons";
import { Meta, Pill } from "@/src/components/ui";
import { type RoleId } from "@/src/constants/roles";
import { colors } from "@/src/constants/theme";

type AvatarEditorProps = {
  role: RoleId;
  initials: string;
  /** A local preview URI or saved avatar URL; falls back to initials. */
  displayUri: string | null;
  /** Accent colour for the camera badge and "Change photo" pill (hex). */
  accent: string;
  size?: number;
  uploading?: boolean;
  onPress: () => void;
};

/**
 * Avatar with a camera badge and a "Change photo" pill — the editable avatar
 * used on the profile-settings and manage-child screens.
 */
export function AvatarEditor({
  role,
  initials,
  displayUri,
  accent,
  size = 92,
  uploading = false,
  onPress,
}: AvatarEditorProps) {
  const badge = Math.round(size * 0.34);
  return (
    <View className="items-center">
      <View className="relative mb-3">
        {displayUri ? (
          <View
            className="overflow-hidden"
            style={{ width: size, height: size, borderRadius: size / 2 }}>
            <Image
              source={{ uri: displayUri }}
              style={{ width: size, height: size }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <Avatar role={role} size={size} initials={initials} />
        )}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          className="absolute -right-1 -bottom-1 items-center justify-center rounded-full border-[3px]"
          style={{
            width: badge,
            height: badge,
            backgroundColor: accent,
            borderColor: colors.surface,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 4,
          }}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <CameraIcon size={Math.round(badge * 0.47)} color="#fff" />
          )}
        </Pressable>
      </View>
      <Pressable onPress={onPress} accessibilityRole="button">
        <Pill color={accent} className="px-3.5 py-1.5">
          <Meta style={{ color: accent }}>Change photo</Meta>
        </Pill>
      </Pressable>
    </View>
  );
}
