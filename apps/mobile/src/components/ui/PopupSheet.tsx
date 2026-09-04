import { useEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, easing } from "@/src/constants/theme";

type PopupSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
};

/**
 * Reusable bottom popup card. The backdrop fades in/out while the card
 * slides up from (and back down to) the bottom of the screen — the two
 * animate independently, so the darkening never appears to slide.
 */
export function PopupSheet({ visible, onDismiss, children }: PopupSheetProps) {
  const { height } = useWindowDimensions();
  const [rendered, setRendered] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      progress.value = withTiming(1, { duration: easing.base });
    } else {
      progress.value = withTiming(0, { duration: easing.base }, (finished) => {
        if (finished) runOnJS(setRendered)(false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height }],
  }));

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <Animated.View style={cardStyle}>
          {/* Swallow taps inside the card so they don't dismiss it. */}
          <Pressable onPress={() => {}}>
            <SafeAreaView edges={["bottom"]} style={styles.card}>
              {children}
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
});
