import { TextInput, View, type TextInput as RNTextInput } from "react-native";

import { bodyFont, colors } from "@/src/constants/theme";

// Tints not in the core palette.
const DANGER_FILL = "rgba(229,62,62,0.12)";
const DANGER_BORDER = "rgba(229,62,62,0.3)";
const FILLED = "rgba(241,88,37,0.08)";
const FILLED_BORDER = "rgba(241,88,37,0.45)";

type OtpInputProps = {
  code: string[];
  error?: boolean;
  inputRefs: { current: (RNTextInput | null)[] };
  onChange: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
  length?: number;
};

function boxColors(error: boolean, filled: boolean) {
  if (error)
    return { bg: DANGER_FILL, border: DANGER_BORDER, text: colors.danger };
  if (filled)
    return { bg: FILLED, border: FILLED_BORDER, text: colors.textPrimary };
  return {
    bg: colors.surface2,
    border: colors.borderStrong,
    text: colors.textPrimary,
  };
}

/** A row of single-digit boxes for entering a one-time code. */
export function OtpInput({
  code,
  error = false,
  inputRefs,
  onChange,
  onKeyPress,
  length = 6,
}: OtpInputProps) {
  return (
    <View className="flex-row justify-center gap-2.5">
      {Array.from({ length }).map((_, i) => {
        const c = boxColors(error, !!code[i]);
        return (
          <TextInput
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            value={code[i]}
            onChangeText={(v) => onChange(i, v)}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={i === 0 ? length : 1}
            autoFocus={i === 0}
            selectTextOnFocus
            style={{
              width: 46,
              height: 58,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: c.border,
              backgroundColor: c.bg,
              color: c.text,
              fontSize: 24,
              fontFamily: bodyFont("600"),
              textAlign: "center",
            }}
          />
        );
      })}
    </View>
  );
}
