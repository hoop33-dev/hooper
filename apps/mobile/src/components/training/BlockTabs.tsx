import { Caption } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useBlockTabsIndicator } from "@/src/hooks/useBlockTabsIndicator";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

const TAB_BAR_HEIGHT = 44;
const INDICATOR_HEIGHT = 2;

type BlockTabsProps = {
  blocks: { id: string; name: string }[];
  blockIdx: number;
  doneFlags: boolean[];
  onSelect: (index: number) => void;
  /** Live pixel scroll offset of the block pager — see useBlockTabsIndicator. */
  scrollX: SharedValue<number>;
};

export function BlockTabs({
  blocks,
  blockIdx,
  doneFlags,
  onSelect,
  scrollX,
}: BlockTabsProps) {
  const { width: pageWidth } = useWindowDimensions();
  const { activeIdx, onTabsScroll, handleTabLayout, indicatorStyle } =
    useBlockTabsIndicator(scrollX, pageWidth, blockIdx, blocks.length);

  return (
    <View
      className="border-border-subtle flex-shrink-0 border-b"
      style={{ height: TAB_BAR_HEIGHT, overflow: "hidden" }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onTabsScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}>
        {blocks.map((b, i) => {
          const active = i === activeIdx;
          return (
            <Pressable
              key={b.id}
              onPress={() => onSelect(i)}
              onLayout={(e) => handleTabLayout(i, e)}
              className="flex-row items-center gap-1.5 px-3.5"
              style={{ height: TAB_BAR_HEIGHT }}>
              <Caption
                numberOfLines={1}
                className={
                  active
                    ? "font-bold text-white"
                    : doneFlags[i]
                      ? ""
                      : "text-text-tertiary"
                }>
                {b.name}
              </Caption>
            </Pressable>
          );
        })}
      </Animated.ScrollView>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 0,
            top: TAB_BAR_HEIGHT - INDICATOR_HEIGHT,
            height: INDICATOR_HEIGHT,
            backgroundColor: colors.brandOrange,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
}
