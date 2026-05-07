import { useState, forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  type TextInput as RNTextInput,
} from "react-native";
import { colors } from "@/src/constants/theme";

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
          className={`font-inter font-medium text-[10px] tracking-[1.2px] uppercase ${error || hasError ? "text-danger" : "text-text-tertiary"}`}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textDisabled}
        underlineColorAndroid="transparent"
        className={`bg-surface-2 rounded-lg border font-inter text-[15px] text-white/85 px-5 h-12 ${borderClass} ${inputClassName}`}
        style={{ textAlignVertical: "center", paddingVertical: 12 }}
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
        <Text className="font-inter text-[11px] text-danger">{error}</Text>
      ) : hint ? (
        <Text className="font-inter text-[11px] text-text-tertiary">{hint}</Text>
      ) : null}
    </View>
  );
});
