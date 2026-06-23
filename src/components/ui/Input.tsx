import { useState, forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type TextInput as RNTextInput,
} from "react-native";
import { colors, fonts} from "@/src/constants/theme";

type InputProps = Omit<TextInputProps, "style"> & {
  label?: string;
  hint?: string;
  error?: string;
  hasError?: boolean;
  className?: string;
  inputClassName?: string;
};

export const Input = forwardRef<RNTextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    hasError = false,
    className = "",
    inputClassName = "",
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass =
    error || hasError
      ? "border-danger"
      : focused
        ? "border-brand-orange"
        : "border-border-subtle";

  return (
    <View className={`gap-1.5 ${className}`}>
      {label ? (
        <Text
          className={error || hasError ? "text-danger" : "text-text-tertiary"}
          style={{
            fontFamily: fonts.bodyMedium,
            fontWeight: "500",
            fontSize: 10,
            letterSpacing: 10 * 0.12,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textDisabled}
        underlineColorAndroid="transparent"
        className={`bg-surface-2 rounded-lg border ${borderClass} ${inputClassName}`}
        style={{
          fontFamily: fonts.body,
          fontSize: 15,
          color: "rgba(255,255,255,0.85)",
          paddingHorizontal: 20,
          paddingVertical: 12,
          height: 48,
          textAlignVertical: "center",
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text
          className="text-danger"
          style={{ fontFamily: fonts.body, fontSize: 11 }}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          className="text-text-tertiary"
          style={{ fontFamily: fonts.body, fontSize: 11 }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
