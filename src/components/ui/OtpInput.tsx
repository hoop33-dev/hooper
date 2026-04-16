import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts } from "@/src/constants/theme";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Only accept digits and show numeric keyboard. Default: true */
  numeric?: boolean;
  label?: string;
  error?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  length,
  value,
  onChange,
  numeric = true,
  label,
  error,
  autoFocus = false,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  // The cell that acts as the cursor position (next cell to fill, or last when full)
  const activeCellIndex = Math.min(value.length, length - 1);

  function handleChangeText(text: string) {
    const filtered = numeric
      ? text.replace(/\D/g, "")
      : text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    onChange(filtered.slice(0, length));
  }

  return (
    <View style={{ gap: 6 }}>
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

      {/* Cell row — TextInput is an invisible overlay covering the full row so
          any tap directly focuses it natively (no Pressable + focus() needed) */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* Cell boxes */}
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? "";
          const isFilled = i < value.length;
          const isActive = focused && i === activeCellIndex;

          let borderColor = "transparent";
          if (error) {
            borderColor = "rgba(242,101,34,0.4)";
          } else if (isActive) {
            borderColor = colors.primary;
          } else if (isFilled) {
            borderColor = "rgba(242,101,34,0.2)";
          }

          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 12,
                backgroundColor: colors.surfaceHigh,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor,
              }}
            >
              {char ? (
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 22,
                    color: colors.onSurface,
                  }}
                >
                  {char}
                </Text>
              ) : null}
            </View>
          );
        })}

        {/* Transparent TextInput covers the entire cell row — tapping anywhere
            on the row focuses it natively without any programmatic focus() call */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType={numeric ? "number-pad" : "default"}
          autoCapitalize={numeric ? "none" : "characters"}
          autoCorrect={false}
          maxLength={length}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          caretHidden
          style={StyleSheet.absoluteFillObject}
          // opacity must be 0 so the TextInput is invisible but still tappable
          opacity={0}
        />
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
