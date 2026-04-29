import { Text } from "react-native";

export function DisclosureLabel() {
  return (
    <Text
      className="text-text-secondary"
      style={{ fontFamily: "Inter", fontSize: 12.5, lineHeight: 12.5 * 1.55 }}
    >
      {"I confirm I am 16 or older and agree to Hooper's "}
      <Text className="text-brand-blue underline">Terms of Service</Text>
      {" and "}
      <Text className="text-brand-blue underline">Privacy Policy</Text>. I
      understand my data will be used to personalise my training experience.
    </Text>
  );
}
