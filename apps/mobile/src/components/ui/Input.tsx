import { colors } from "@/src/constants/theme";
import { forwardRef, useState } from "react";
import {
  TextInput,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
} from "react-native";

import { BODY_FONT, Caption, Label } from "./Typography";

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
        <Label className={error || hasError ? "text-danger" : ""}>
          {label}
        </Label>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textDisabled}
        underlineColorAndroid="transparent"
        className={`bg-surface-2 rounded-lg border ${borderClass} ${inputClassName}`}
        style={{
          fontFamily: BODY_FONT,
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
        <Caption className="text-danger">{error}</Caption>
      ) : hint ? (
        <Caption>{hint}</Caption>
      ) : null}
    </View>
  );
});
