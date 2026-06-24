import { fonts } from "@/src/constants/theme";
import { Linking, Text } from "react-native";

export function DisclosureLabel() {
  return (
    <Text
      className="text-text-secondary"
      style={{
        fontFamily: fonts.body,
        fontSize: 12.5,
        lineHeight: 12.5 * 1.55,
      }}>
      {"I agree to Hooper's "}
      <Text
        className="text-brand-blue underline"
        onPress={() => Linking.openURL("https://www.hoop33.co.nz/terms")}>
        Terms of Service
      </Text>
      {" and "}
      <Text
        className="text-brand-blue underline"
        onPress={() =>
          Linking.openURL("https://www.hoop33.co.nz/privacypolicy")
        }>
        Privacy Policy
      </Text>
      {
        ". I understand my data will be used to personalise my training experience."
      }
    </Text>
  );
}
