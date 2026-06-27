import { View } from "react-native";

import { BackButton } from "./BackButton";
import { ScreenTitle } from "./Typography";

type ScreenHeaderProps = {
  title: string;
  /** Label for the back link (e.g. the screen you came from). */
  backLabel: string;
  onBack: () => void;
};

/**
 * The standard header for pushed (non-tab) screens: a back link above a large
 * screen title, with the safe-area top padding baked in.
 */
export function ScreenHeader({ title, backLabel, onBack }: ScreenHeaderProps) {
  return (
    <View className="px-5 pt-[58px] pb-1">
      <BackButton label={backLabel} onPress={onBack} className="mb-4" />
      <ScreenTitle>{title}</ScreenTitle>
    </View>
  );
}
