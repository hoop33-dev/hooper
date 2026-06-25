import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

import { roleConfig, type RoleId } from "@/src/constants/roles";
import { bodyFont } from "@/src/constants/theme";

type AvatarProps = {
  role: RoleId;
  size?: number;
  initials: string;
  imageUrl?: string | null;
};

function shade(hex: string, pct: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * pct);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

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
        <LinearGradient
          colors={[r.accent, shade(r.accent, -22)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
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
        </LinearGradient>
      )}
    </View>
  );
}
