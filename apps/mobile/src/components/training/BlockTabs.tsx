import { Caption } from "@/src/components/ui";
import { colors } from "@/src/constants/theme";
import { useBlockTabsIndicator } from "@/src/hooks/useBlockTabsIndicator";
import type { LayoutChangeEvent } from "react-native";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const TAB_BAR_HEIGHT = 44;
const INDICATOR_HEIGHT = 2;

const AnimatedCaption = Animated.createAnimatedComponent(Caption);

type BlockTabsProps = {
  blocks: { id: string; name: string }[];
  doneFlags: boolean[];
  onSelect: (index: number) => void;
  /** Live pixel scroll offset of the block pager — see useBlockTabsIndicator. */
  scrollX: SharedValue<number>;
};

type BlockTabProps = {
  name: string;
  index: number;
  done: boolean;
  scrollX: SharedValue<number>;
  pageWidth: number;
  tabCount: number;
  onSelect: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

/**
 * A single tab. One label node, whose color crossfades between inactive and
 * active straight off `scrollX` in a UI-thread `useAnimatedStyle` — an
 * instant toggle rather than a JS-state flag that would lag a frame or more
 * behind the underline (see useBlockTabsIndicator.ts). Previously this
 * stacked three copies of the label (an invisible bold "sizer" plus two
 * absolutely-positioned overlays) to crossfade weight as well as color, but
 * the overlays' width ended up pinned to the sizer's own measured width —
 * whenever that measurement came out narrower than the real label (which it
 * can, e.g. depending on how a given platform resolves synthetic bold on a
 * custom font), the visible label was clipped with an ellipsis. A single,
 * naturally-sized text node can't be clipped by another node's measurement.
 */
function BlockTab({
  name,
  index,
  done,
  scrollX,
  pageWidth,
  tabCount,
  onSelect,
  onLayout,
}: BlockTabProps) {
  const labelStyle = useAnimatedStyle(() => {
    const active =
      tabCount > 0 &&
      pageWidth > 0 &&
      Math.round(
        Math.min(tabCount - 1, Math.max(0, scrollX.value / pageWidth)),
      ) === index;
    return { color: active ? colors.textPrimary : colors.textTertiary };
  });

  return (
    <Pressable
      onPress={onSelect}
      onLayout={onLayout}
      className="flex-row items-center gap-1.5 px-3.5"
      style={{ height: TAB_BAR_HEIGHT }}>
      <AnimatedCaption
        numberOfLines={1}
        className={done ? "" : "text-text-tertiary"}
        style={labelStyle}>
        {name}
      </AnimatedCaption>
    </Pressable>
  );
}

export function BlockTabs({
  blocks,
  doneFlags,
  onSelect,
  scrollX,
}: BlockTabsProps) {
  const { width: pageWidth } = useWindowDimensions();
  const {
    onTabsScroll,
    handleTabsLayout,
    handleTabLayout,
    indicatorStyle,
    tabsScrollRef,
  } = useBlockTabsIndicator(scrollX, pageWidth, blocks.length);

  return (
    <View
      className="border-border-subtle flex-shrink-0 border-b"
      style={{ height: TAB_BAR_HEIGHT, overflow: "hidden" }}>
      <Animated.ScrollView
        ref={tabsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onTabsScroll}
        onLayout={handleTabsLayout}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}>
        {blocks.map((b, i) => (
          <BlockTab
            key={b.id}
            name={b.name}
            index={i}
            done={doneFlags[i]}
            scrollX={scrollX}
            pageWidth={pageWidth}
            tabCount={blocks.length}
            onSelect={() => onSelect(i)}
            onLayout={(e) => handleTabLayout(i, e)}
          />
        ))}
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
