import { forwardRef } from "react";
import { View, Text, type TextInput as RNTextInput } from "react-native";
import { Input } from "./Input";
import { ErrorMessage } from "./ErrorMessage";
import { fonts } from "@/src/constants/theme";

type PhoneInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  countryCode?: string;
  returnKeyType?: import("react-native").TextInputProps["returnKeyType"];
  blurOnSubmit?: boolean;
  onSubmitEditing?: import("react-native").TextInputProps["onSubmitEditing"];
};

export const PhoneInput = forwardRef<RNTextInput, PhoneInputProps>(
  function PhoneInput(
    {
      label,
      value,
      onChangeText,
      error,
      placeholder = "21 000 0000",
      countryCode = "+64",
      returnKeyType,
      blurOnSubmit,
      onSubmitEditing,
    },
    ref,
  ) {
    return (
      <View className="gap-1.5">
        {label && (
          <Text
            className={
              error ? "text-danger uppercase" : "text-text-tertiary uppercase"
            }
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 10,
              letterSpacing: 10 * 0.12,
            }}
          >
            {label}
          </Text>
        )}

        <View className="flex-row items-stretch gap-2">
          {/* Country code badge — stretches to match the Input height */}
          <View
            className={`bg-surface-2 items-center justify-center self-stretch rounded-[10px] border-[1.5px] px-4 ${error ? "border-danger" : "border-border-subtle"}`}
          >
            <Text
              className="text-text-secondary text-[15px] font-medium"
              style={{ fontFamily: fonts.body }}
            >
              {countryCode}
            </Text>
          </View>

          {/* Number input */}
          <Input
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            hasError={!!error}
            className="flex-1"
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            onSubmitEditing={onSubmitEditing}
          />
        </View>

        {error && <ErrorMessage message={error} />}
      </View>
    );
  },
);
