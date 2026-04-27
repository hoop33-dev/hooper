import { forwardRef } from "react";
import { View, Text, type TextInput as RNTextInput } from "react-native";
import { Input } from "./Input";

type PhoneInputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  countryCode?: string;
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
    },
    ref,
  ) {
    return (
      <View style={{ gap: 6 }}>
        {label ? (
          <Text
            style={{
              fontFamily: "Inter",
              fontWeight: "500",
              fontSize: 10,
              letterSpacing: 10 * 0.12,
              textTransform: "uppercase",
              color: error ? "#E53E3E" : "rgba(255,255,255,0.35)",
            }}
          >
            {label}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "stretch", gap: 8 }}>
          {/* Country code badge — stretches to match the Input height */}
          <View
            style={{
              alignSelf: "stretch",
              paddingHorizontal: 16,
              backgroundColor: "#2D2829",
              borderWidth: 1.5,
              borderColor: error ? "#E53E3E" : "rgba(255,255,255,0.08)",
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                color: "rgba(255,255,255,0.65)",
                fontWeight: "500",
              }}
            >
              {countryCode}
            </Text>
          </View>

          {/* Number input — explicit h-12 so badge can match */}
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
          />
        </View>

        {error ? (
          <Text style={{ fontFamily: "Inter", fontSize: 11, color: "#E53E3E" }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);
