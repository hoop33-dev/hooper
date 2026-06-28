import { type ReactNode } from "react";
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`h-[52px] flex-row items-center justify-center gap-2 rounded-full ${
        muted ? "border-border-subtle border" : ""
      } ${className}`}
      style={{
        backgroundColor: muted
          ? colors.surface2
          : loading
            ? `${accent}80`
            : accent,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: muted || loading ? 0 : 0.45,
        shadowRadius: 16,
        elevation: muted ? 0 : 6,
      }}>
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
