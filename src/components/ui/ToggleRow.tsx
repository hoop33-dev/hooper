import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { IconTile } from "./IconTile";
import { Switch } from "./Switch";
import { Caption, RowTitle } from "./Typography";

type ToggleRowProps = {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  /** Accent colour for the icon tile and switch (hex). */
  accent: string;
  icon: ReactNode;
};

/** A settings row with an icon, title, description and a trailing toggle. */
export function ToggleRow({
  title,
  sub,
  value,
  onChange,
  accent,
  icon,
}: ToggleRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className="border-border-subtle bg-surface-2 flex-row items-center gap-3.5 rounded-2xl border px-4 py-3.5">
      <IconTile color={accent} size={36}>
        {icon}
      </IconTile>
      <View className="min-w-0 flex-1">
        <RowTitle>{title}</RowTitle>
        <Caption className="mt-0.5">{sub}</Caption>
      </View>
      <Switch on={value} accent={accent} />
    </Pressable>
  );
}
