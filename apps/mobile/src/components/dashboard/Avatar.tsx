import { Image, Text, View } from "react-native";

import { bodyFont, colors } from "@/src/constants/theme";

type AvatarProps = {
  size?: number;
  initials: string;
  imageUrl?: string | null;
};

export function Avatar({ size = 42, initials, imageUrl }: AvatarProps) {
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
            backgroundColor: colors.brandOrange,
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
