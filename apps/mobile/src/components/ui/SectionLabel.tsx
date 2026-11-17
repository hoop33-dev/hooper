import { View } from "react-native";

import { Overline } from "./Typography";

type SectionLabelProps = {
  title: string;
  /** Extra classes on the wrapper (e.g. to tweak padding). */
  className?: string;
};

/**
 * The uppercase heading that separates groups of rows on the settings,
 * security and profile screens. Previously hand-rolled (and duplicated)
 * in four screens — this is the one definition.
 */
export function SectionLabel({ title, className = "" }: SectionLabelProps) {
  return (
    <View className={`px-5 pt-7 pb-3 ${className}`}>
      <Overline>{title}</Overline>
    </View>
  );
}
