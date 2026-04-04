import { Pressable, View, Text } from "react-native";
import { colors, fonts } from "@/src/constants/theme";
import { Icon } from "./Icon";

// ── Checkbox ─────────────────────────────────────────────────────────────────

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
      className={`flex-row items-center gap-3 ${className}`}
    >
      <View
        className="w-5 h-5 rounded-md items-center justify-center"
        style={{
          backgroundColor: checked ? colors.primary : colors.surfaceHighest,
        }}
      >
        {checked && <Icon name="checkmark" size={12} color="on-surface" />}
      </View>

      {label && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 24,
            color: colors.onSurface,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ── Radio ─────────────────────────────────────────────────────────────────────

interface RadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Radio({
  selected,
  onSelect,
  label,
  disabled = false,
  className = "",
}: RadioProps) {
  return (
    <Pressable
      onPress={() => !disabled && onSelect()}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
      className={`flex-row items-center gap-3 ${className}`}
    >
      <View
        className="w-5 h-5 rounded-full items-center justify-center"
        style={{ backgroundColor: colors.surfaceHighest }}
      >
        {selected && (
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </View>

      {label && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 16,
            lineHeight: 24,
            color: colors.onSurface,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
