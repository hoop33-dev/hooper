import { useState, type ReactNode } from "react";
import {
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { colors } from "@/src/constants/theme";

import { BODY_FONT, Caption, Label } from "./Typography";

/**
 * The shared text style for editable input text. `TextInput` renders its own
 * text (it isn't a Typography component), so its font lives here — one place.
 */
const inputTextStyle: TextStyle = {
  fontFamily: BODY_FONT,
  fontSize: 15,
  color: colors.textPrimary,
};

function resolveBorderColor(
  error?: boolean,
  focused?: boolean,
  accent?: string,
) {
  if (error) return colors.danger;
  if (focused) return accent;
  return colors.borderSubtle;
}

function containerLayout(multiline?: boolean): ViewStyle {
  return multiline
    ? { alignItems: "flex-start", paddingVertical: 12 }
    : { alignItems: "center", minHeight: 48 };
}

function inputLayout(multiline?: boolean, numberOfLines?: number): TextStyle {
  return multiline
    ? {
        textAlignVertical: "top",
        minHeight: numberOfLines ? numberOfLines * 22 : 66,
      }
    : { textAlignVertical: "center", minHeight: 48 };
}

type FieldProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Leading text inside the box, e.g. "@". */
  prefix?: string;
  /** Trailing node inside the box, e.g. a status indicator. */
  suffix?: ReactNode;
  /** Accent colour for the focus border (hex). */
  accent: string;
  error?: boolean;
  errorText?: string;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  inputRef?: React.RefObject<RNTextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done" | "go";
  blurOnSubmit?: boolean;
};

/**
 * A labelled text field with an accent focus border, optional prefix/suffix,
 * multiline support and inline error text. The single definition behind the
 * profile-settings and manage-child forms.
 */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  accent,
  error,
  errorText,
  multiline,
  numberOfLines,
  autoCapitalize = "sentences",
  inputRef,
  onSubmitEditing,
  returnKeyType,
  blurOnSubmit,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label ? (
        <Label className={error ? "text-danger mb-1.5" : "mb-1.5"}>
          {label}
        </Label>
      ) : null}
      <View
        className="flex-row rounded-[10px] px-3.5"
        style={[
          {
            backgroundColor: focused
              ? "rgba(255,255,255,0.06)"
              : colors.surface2,
            borderWidth: 1.5,
            borderColor: resolveBorderColor(error, focused, accent),
          },
          containerLayout(multiline),
        ]}>
        {prefix ? (
          <Text
            style={[
              inputTextStyle,
              { color: colors.textTertiary, marginRight: 2 },
            ]}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit ?? !multiline}
          style={[
            inputTextStyle,
            { flex: 1 },
            inputLayout(multiline, numberOfLines),
          ]}
        />
        {suffix ? <View className="ml-2">{suffix}</View> : null}
      </View>
      {errorText ? (
        <Caption className="text-danger mt-1">{errorText}</Caption>
      ) : null}
    </View>
  );
}
