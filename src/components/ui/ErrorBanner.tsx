import { View, Text } from "react-native";
import { colors } from "@/src/constants/theme";

type ErrorBannerProps = {
  variant?: "error" | "success";
  title?: string;
  message: string;
};

const bannerStyles = {
  error: {
    bg: "rgba(229,62,62,0.12)",
    border: "rgba(229,62,62,0.35)",
    titleColor: colors.danger,
    messageColor: colors.danger,
  },
  success: {
    bg: "rgba(56,161,105,0.12)",
    border: "rgba(56,161,105,0.35)",
    titleColor: colors.success,
    messageColor: "rgba(56,161,105,0.85)",
  },
};

export function ErrorBanner({
  variant = "error",
  title,
  message,
}: ErrorBannerProps) {
  const s = bannerStyles[variant];
  return (
    <View
      style={{
        backgroundColor: s.bg,
        borderWidth: 1,
        borderColor: s.border,
        borderRadius: 10,
        padding: title ? 16 : 12,
        gap: title ? 4 : undefined,
      }}
    >
      {title ? (
        <Text
          style={{
            fontFamily: "Inter",
            fontWeight: "600",
            fontSize: 14,
            color: s.titleColor,
          }}
        >
          {title}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: "Inter",
          fontSize: 13,
          color: s.messageColor,
          lineHeight: 18,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
