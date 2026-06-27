import { bodyFont } from "@/src/constants/theme";
import { forwardRef, useState } from "react";
import {
  Pressable,
  Text,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { ErrorMessage } from "./ErrorMessage";
import { Input } from "./Input";
import { PasswordStrengthBar } from "./PasswordStrengthBar";

type PasswordInputProps = Omit<TextInputProps, "style" | "secureTextEntry"> & {
  label?: string;
  error?: string;
  hasError?: boolean;
  showStrength?: boolean;
};

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.8}
        strokeLinecap="round">
        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
        <Path d="M1 1l22 22" />
      </Svg>
    );
  }
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth={1.8}
      strokeLinecap="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

export const PasswordInput = forwardRef<RNTextInput, PasswordInputProps>(
  function PasswordInput(
    { label, error, hasError, showStrength, ...rest },
    ref,
  ) {
    const [show, setShow] = useState(false);
    const isError = !!error || !!hasError;
    const valueStr = typeof rest.value === "string" ? rest.value : "";

    return (
      <View className="gap-1.5">
        {label && (
          <Text
            className={
              isError ? "text-danger uppercase" : "text-text-tertiary uppercase"
            }
            style={{
              fontFamily: bodyFont("500"),
              fontSize: 10,
              letterSpacing: 10 * 0.12,
            }}>
            {label}
          </Text>
        )}
        <View>
          <Input
            ref={ref}
            hasError={isError}
            inputClassName="pr-12"
            secureTextEntry={!show}
            {...rest}
          />
          <Pressable
            onPress={() => setShow((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              bottom: 0,
              height: 48,
              justifyContent: "center",
              padding: 4,
            }}
            hitSlop={8}
            accessibilityLabel={show ? "Hide password" : "Show password"}>
            <EyeIcon visible={show} />
          </Pressable>
        </View>
        {showStrength && <PasswordStrengthBar value={valueStr} />}
        {error && <ErrorMessage message={error} />}
      </View>
    );
  },
);
