import { useCallback, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { SkipBack10Icon, SkipForward10Icon } from "../icons";

const DOUBLE_TAP_WINDOW_MS = 300;
const FLASH_VISIBLE_MS = 350;
const FLASH_FADE_MS = 300;

type SkipZone = "back" | "forward";

/** Detects a double tap within the same zone (left/right third of the
 * screen), YouTube-style. A single tap is only committed after waiting out
 * the double-tap window with no follow-up tap in the same zone — this is
 * the standard tradeoff of recognizing double tap without a gesture
 * library (react-native-gesture-handler isn't installed in this app; every
 * other drag interaction here uses core RN's PanResponder instead, see
 * ScrubBar/Slider/Carousel). A tap in the *other* zone never counts toward
 * a double tap, matching YouTube's left/right-independent zones. */
function useZoneTap(
  onSingleTap: () => void,
  onDoubleTap: (zone: SkipZone) => void,
) {
  const lastTapRef = useRef<{ zone: SkipZone; time: number } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (zone: SkipZone) => {
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        last.zone === zone &&
        now - last.time < DOUBLE_TAP_WINDOW_MS
      ) {
        if (pendingTimeoutRef.current) {
          clearTimeout(pendingTimeoutRef.current);
          pendingTimeoutRef.current = null;
        }
        lastTapRef.current = null;
        onDoubleTap(zone);
        return;
      }
      lastTapRef.current = { zone, time: now };
      pendingTimeoutRef.current = setTimeout(() => {
        lastTapRef.current = null;
        pendingTimeoutRef.current = null;
        onSingleTap();
      }, DOUBLE_TAP_WINDOW_MS);
    },
    [onSingleTap, onDoubleTap],
  );
}

type DoubleTapSeekOverlayProps = {
  onSkip: (deltaSeconds: number) => void;
  onSingleTap: () => void;
};

/** Sits above VideoSurface and below PlayerControls (see VideoPlayerModal),
 * splitting the video into left/middle/right thirds: double-tapping the
 * left or right third skips ±10s (with a brief icon flash on that side,
 * like YouTube), while a single tap anywhere — including a lone tap in the
 * skip zones once the double-tap window elapses — toggles play/pause. */
export function DoubleTapSeekOverlay({
  onSkip,
  onSingleTap,
}: DoubleTapSeekOverlayProps) {
  const [flashZone, setFlashZone] = useState<SkipZone | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const triggerFlash = useCallback(
    (zone: SkipZone) => {
      setFlashZone(zone);
      opacity.stopAnimation();
      opacity.setValue(1);
      Animated.timing(opacity, {
        toValue: 0,
        duration: FLASH_FADE_MS,
        delay: FLASH_VISIBLE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setFlashZone(null);
      });
    },
    [opacity],
  );

  const handleDoubleTap = useCallback(
    (zone: SkipZone) => {
      onSkip(zone === "back" ? -10 : 10);
      triggerFlash(zone);
    },
    [onSkip, triggerFlash],
  );

  const handleZoneTap = useZoneTap(onSingleTap, handleDoubleTap);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Pressable style={{ flex: 1 }} onPress={() => handleZoneTap("back")} />
        <Pressable style={{ flex: 1 }} onPress={onSingleTap} />
        <Pressable
          style={{ flex: 1 }}
          onPress={() => handleZoneTap("forward")}
        />
      </View>
      {flashZone ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashZone,
            flashZone === "back" ? { left: 0 } : { right: 0 },
            { opacity },
          ]}>
          <View style={styles.flashBubble}>
            {flashZone === "back" ? (
              <SkipBack10Icon size={30} color="#fff" />
            ) : (
              <SkipForward10Icon size={30} color="#fff" />
            )}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flashZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "33%",
    alignItems: "center",
    justifyContent: "center",
  },
  flashBubble: {
    height: 64,
    width: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
