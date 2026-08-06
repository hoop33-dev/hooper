import { Badge, Caption } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { Pressable, ScrollView } from "react-native";

type BlockTabsProps = {
  blocks: { id: string; name: string; is_superset: boolean }[];
  blockIdx: number;
  doneFlags: boolean[];
  onSelect: (index: number) => void;
};

export function BlockTabs({ blocks, blockIdx, doneFlags, onSelect }: BlockTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="border-border-subtle flex-shrink-0 border-b"
      style={{ height: 44, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}>
      {blocks.map((b, i) => {
        const active = i === blockIdx;
        return (
          <Pressable
            key={b.id}
            onPress={() => onSelect(i)}
            className="flex-row items-center gap-1.5 px-3.5 py-2.5"
            style={{ borderBottomWidth: 2, borderBottomColor: active ? colors.brandOrange : "transparent" }}>
            <Caption
              className={active ? "font-bold text-white" : doneFlags[i] ? "" : "text-text-tertiary"}>
              {b.name}
            </Caption>
            {b.is_superset ? (
              <Badge variant="navy" className="px-1.5 py-0.5">
                SS
              </Badge>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
