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
 * A single tab. Renders the label twice, stacked: a static base layer with
 * the normal inactive styling, and an always-mounted white/bold overlay
 * whose opacity is driven straight off `scrollX` in `useAnimatedStyle` —
 * an instant, UI-thread toggle rather than a JS-state flag that would lag
 * a frame or more behind the underline (see useBlockTabsIndicator.ts).
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
  const activeStyle = useAnimatedStyle(() => {
    const active =
      tabCount > 0 &&
      pageWidth > 0 &&
      Math.round(
        Math.min(tabCount - 1, Math.max(0, scrollX.value / pageWidth)),
      ) === index;
    return { opacity: active ? 1 : 0 };
  });

  return (
    <Pressable
      onPress={onSelect}
      onLayout={onLayout}
      className="flex-row items-center gap-1.5 px-3.5"
      style={{ height: TAB_BAR_HEIGHT }}>
      <View>
        {/* Invisible sizer, bold like the active label below: reserves box
            width for the wider of the two weights up front. font-bold makes
            iOS synthesize thicker (wider) glyphs even on this named font, so
            without this the box sizes to the narrower inactive label and
            clips the bold active one when it's shown. */}
        <Caption numberOfLines={1} className="font-bold opacity-0">
          {name}
        </Caption>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}>
          <Caption
            numberOfLines={1}
            className={done ? "" : "text-text-tertiary"}>
            {name}
          </Caption>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
            activeStyle,
          ]}>
          <Caption numberOfLines={1} className="font-bold text-white">
            {name}
          </Caption>
        </Animated.View>
      </View>
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
