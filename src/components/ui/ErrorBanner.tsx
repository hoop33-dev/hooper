import { View, Text } from "react-native";

type ErrorBannerProps = {
  variant?: "error" | "success";
  title?: string;
  message: string;
};

const bannerStyles = {
  error: {
    bg: "rgba(229,62,62,0.12)",
    border: "rgba(229,62,62,0.35)",
    titleColor: "#E53E3E",
    messageColor: "#E53E3E",
  },
  success: {
    bg: "rgba(56,161,105,0.12)",
    border: "rgba(56,161,105,0.35)",
    titleColor: "#38A169",
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
      className="rounded-[10px] border"
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        padding: title ? 16 : 12,
        gap: title ? 4 : undefined,
      }}
    >
      {title ? (
        <Text
          className="font-inter font-semibold text-sm"
          style={{ color: s.titleColor }}
        >
          {title}
        </Text>
      ) : null}
      <Text
        className="font-inter text-[13px] leading-[18px]"
        style={{ color: s.messageColor }}
      >
        {message}
      </Text>
    </View>
  );
}
