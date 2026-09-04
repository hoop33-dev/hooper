import { useState, type ReactNode } from "react";
import { Pressable } from "react-native";

import { colors } from "@/src/constants/theme";

import { Lead } from "./Typography";

type AccentButtonProps = {
  onPress?: () => void;
  /** Accent colour for the solid background / glow (hex). */
  accent: string;
  /** Label (string) or custom content (e.g. an ActivityIndicator). */
  children: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** "solid" = accent CTA; "muted" = neutral surface (e.g. a locked state). */
  variant?: "solid" | "muted";
  className?: string;
};

function accentButtonStyle({
  accent,
  muted,
  loading,
  active,
}: {
  accent: string;
  muted: boolean;
  loading: boolean;
  active: boolean;
}) {
  const backgroundColor = muted
    ? colors.surface2
    : loading
      ? `${accent}80`
      : accent;
  return {
    backgroundColor,
    shadowColor: accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: muted || loading ? 0 : 0.45,
    shadowRadius: 16,
    elevation: muted ? 0 : 6,
    transform: [{ scale: active ? 0.97 : 1 }],
    opacity: active ? 0.85 : 1,
  };
}

/**
 * The primary call-to-action button, tinted by a role accent. Used for the
 * sticky "Save changes" actions across the profile and child-management forms.
 */
export function AccentButton({
  onPress,
  accent,
  children,
  icon,
  loading = false,
  disabled = false,
  variant = "solid",
  className = "",
}: AccentButtonProps) {
  const muted = variant === "muted";
  const [pressed, setPressed] = useState(false);
  const active = pressed && !disabled && !loading;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`h-[52px] flex-row items-center justify-center gap-2 rounded-2xl ${
        muted ? "border-border-subtle border" : ""
      } ${className}`}
      style={accentButtonStyle({ accent, muted, loading, active })}>
      {icon}
      {typeof children === "string" ? (
        <Lead className={muted ? "text-text-secondary" : "text-white"}>
          {children}
        </Lead>
      ) : (
        children
      )}
    </Pressable>
  );
}
