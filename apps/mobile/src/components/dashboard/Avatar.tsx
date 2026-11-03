import { Image, Text, View } from "react-native";

import { roleConfig, type RoleId } from "@/src/constants/roles";
import { bodyFont } from "@/src/constants/theme";

type AvatarProps = {
  role: RoleId;
  size?: number;
  initials: string;
  imageUrl?: string | null;
};

export function Avatar({ role, size = 42, initials, imageUrl }: AvatarProps) {
  const r = roleConfig(role);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
      }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: r.accent,
          }}>
          <Text
            style={{
              fontFamily: bodyFont("800"),
              fontSize: size * 0.36,
              letterSpacing: -size * 0.36 * 0.02,
              color: "#FFFFFF",
            }}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}
