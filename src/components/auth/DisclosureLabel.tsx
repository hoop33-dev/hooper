import { Text, Linking } from "react-native";

export function DisclosureLabel() {
  return (
    <Text className="font-inter text-text-secondary text-[12.5px] leading-[19.375px]">
      {"I confirm I am 16 or older and agree to Hooper's "}
      <Text
        className="text-brand-blue underline"
        onPress={() => Linking.openURL("https://www.hoop33.co.nz/terms")}
      >
        Terms of Service
      </Text>
      {" and "}
      <Text
        className="text-brand-blue underline"
        onPress={() =>
          Linking.openURL("https://www.hoop33.co.nz/privacypolicy")
        }
      >
        Privacy Policy
      </Text>
      {
        ". I understand my data will be used to personalise my training experience."
      }
    </Text>
  );
}
