import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";

type CarouselProps<T> = {
  items: T[];
  /** Render each slide. Receives the item and its index. */
  renderItem: (item: T, index: number) => ReactNode;
  /** ms between auto-advances. Pass 0 to disable auto-advance. */
  autoAdvanceMs?: number;
  /** Show the dot indicator row. */
  showDots?: boolean;
  /** Width of each slide; defaults to screen width. */
  width?: number;
  /** Tailwind classes applied to the outer container. */
  className?: string;
  /** Tailwind classes applied to the dot indicator row. */
  dotsClassName?: string;
};

export function Carousel<T>({
  items,
  renderItem,
  autoAdvanceMs = 4000,
  showDots = true,
  width: widthProp,
  className = "",
  dotsClassName = "",
}: CarouselProps<T>) {
  const screenWidth = Dimensions.get("window").width;
  const width = widthProp ?? screenWidth;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Heights keyed by slide index — measured via the hidden layer below.
  const [slideHeights, setSlideHeights] = useState<number[]>(() =>
    new Array(items.length).fill(0),
  );
  const minHeight = Math.max(0, ...slideHeights) || undefined;
  const opacity = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;

  const goTo = useCallback(
    (next: number, direction: 1 | -1) => {
      if (next === index || items.length === 0) return;
      const target = ((next % items.length) + items.length) % items.length;

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: direction * -16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIndex(target);
        translate.setValue(direction * 16);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translate, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [index, items.length, opacity, translate],
  );

  const advance = useCallback(
    (direction: 1 | -1) => {
      goTo(index + direction, direction);
    },
    [goTo, index],
  );

  // Auto-advance
  useEffect(() => {
    if (!autoAdvanceMs || paused || items.length <= 1) return;
    const id = setInterval(() => advance(1), autoAdvanceMs);
    return () => clearInterval(id);
  }, [autoAdvanceMs, paused, advance, items.length]);

  // Keep a ref to advance so the PanResponder (created once) always calls the
  // latest version and never closes over a stale index.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  // Swipe handling — created once; reads advanceRef for current callback.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => setPaused(true),
      onPanResponderRelease: (_e, g) => {
        setPaused(false);
        if (g.dx <= -40) advanceRef.current(1);
        else if (g.dx >= 40) advanceRef.current(-1);
      },
      onPanResponderTerminate: () => setPaused(false),
    }),
  ).current;

  if (items.length === 0) return null;

  return (
    <View className={className}>
      {/* Hidden measurement layer — renders all slides simultaneously so
          minHeight is the true max from the very first paint, keeping the
          dots row at a stable vertical position as slides change. */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", width, opacity: 0 }}
      >
        {items.map((item, i) => (
          <View
            key={i}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              setSlideHeights((prev) => {
                if (prev[i] === h) return prev;
                const next = [...prev];
                next[i] = h;
                return next;
              });
            }}
          >
            {renderItem(item, i)}
          </View>
        ))}
      </View>

      <View {...panResponder.panHandlers} style={{ width, minHeight }}>
        <Animated.View
          style={{
            opacity,
            transform: [{ translateY: translate }],
          }}
        >
          {renderItem(items[index], index)}
        </Animated.View>
      </View>

      {showDots && items.length > 1 && (
        <View
          className={`mt-7 flex-row items-center justify-center gap-1.5 ${dotsClassName}`}
        >
          {items.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goTo(i, i > index ? 1 : -1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1}`}
            >
              <View
                className={`h-1.5 rounded-full ${
                  i === index ? "bg-brand-orange w-5" : "w-1.5 bg-white/20"
                }`}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
