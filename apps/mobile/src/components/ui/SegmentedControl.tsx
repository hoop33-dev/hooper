import { Pressable, View } from "react-native";

import { TabLabel } from "./Typography";

type Segment<T extends string> = { id: T; label: string };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Accent colour of the selected segment (hex). */
  accent: string;
  className?: string;
};

/** A pill-shaped segmented control for switching between a few views. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  accent,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <View
      className={`border-border-subtle bg-surface-2 flex-row rounded-full border p-1 ${className}`}>
      {segments.map((s) => {
        const active = s.id === value;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(s.id)}
            className="h-[38px] flex-1 items-center justify-center rounded-full"
            style={{ backgroundColor: active ? accent : "transparent" }}>
            <TabLabel className={active ? "text-white" : "text-text-secondary"}>
              {s.label}
            </TabLabel>
          </Pressable>
        );
      })}
    </View>
  );
}
