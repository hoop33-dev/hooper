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

        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
        >
          {/* Country code badge */}
          <View
            style={{
              height: 48,
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

          {/* Number input */}
          <Input
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            error={error ? " " : undefined}
            className="flex-1"
          />
        </View>

        {error ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text
              style={{ fontFamily: "Inter", fontSize: 11, color: "#E53E3E" }}
            >
              {error}
            </Text>
          </View>
        ) : null}
      </View>
    );
  },
);
