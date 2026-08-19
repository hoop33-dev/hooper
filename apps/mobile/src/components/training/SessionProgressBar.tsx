import { Caption } from "@/src/components/ui";
import { View } from "react-native";

type SessionProgressBarProps = {
  doneSets: number;
  totalSets: number;
};

/** Overall session progress — sets completed across every block, not just
 * the one currently in view. Purely a display of derived state (setsState
 * vs. each block_exercise's planned set count); nothing here is persisted. */
export function SessionProgressBar({
  doneSets,
  totalSets,
}: SessionProgressBarProps) {
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  return (
    <View className="px-5 pb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Caption>
          {doneSets}/{totalSets} sets
        </Caption>
        <Caption className="text-white">{pct}%</Caption>
      </View>
      <View className="h-1 rounded-full bg-white/10">
        <View
          className="bg-brand-orange h-full rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
