import { useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  View,
  Text,
} from "react-native";
import { colors, fonts } from "@/src/constants/theme";
import { Icon } from "./Icon";
import { Ionicons } from "@expo/vector-icons";

export type InputSize = "sm" | "md" | "lg";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface InputProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string;
  error?: string;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  onRightIconPress?: () => void;
  size?: InputSize;
  className?: string;
}

const sizeConfig: Record<InputSize, { padding: string; fontSize: number; lineHeight: number }> = {
  sm: { padding: "px-4 py-2", fontSize: 14, lineHeight: 20 },
  md: { padding: "px-5 py-3", fontSize: 16, lineHeight: 24 },
  lg: { padding: "px-6 py-4", fontSize: 18, lineHeight: 27 },
};

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  size = "md",
  disabled,
  className = "",
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { padding, fontSize, lineHeight } = sizeConfig[size];

  const fieldStyle = error
    ? { borderWidth: 1, borderColor: "rgba(242,101,34,0.4)" }
    : focused
      ? { borderWidth: 1, borderColor: "rgba(242,101,34,0.2)" }
      : undefined;

  return (
    <View style={{ opacity: disabled ? 0.4 : 1, gap: 6 }}>
      {label && (
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 12,
            lineHeight: 14,
            color: colors.onSurface,
          }}
        >
          {label}
        </Text>
      )}

      <View
        className={`rounded-full bg-surface-high flex-row items-center ${padding} ${className}`}
        style={fieldStyle}
      >
        {leftIcon && (
          <View style={{ marginRight: 8 }}>
            <Icon name={leftIcon} size={16} color="on-surface-muted" />
          </View>
        )}

        <TextInput
          style={[
            {
              flex: 1,
              fontFamily: fonts.regular,
              fontSize,
              lineHeight,
              color: colors.onSurface,
            },
            style,
          ]}
          placeholderTextColor="rgba(245,245,245,0.4)"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          {...props}
        />

        {rightIcon && (
          <View style={{ marginLeft: 8 }}>
            {onRightIconPress ? (
              <Pressable onPress={onRightIconPress} style={{ opacity: 1 }}>
                <Icon name={rightIcon} size={16} color="on-surface-muted" />
              </Pressable>
            ) : (
              <Icon name={rightIcon} size={16} color="on-surface-muted" />
            )}
          </View>
        )}
      </View>

      {error && (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 12,
            color: colors.primary,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
