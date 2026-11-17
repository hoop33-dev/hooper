import { shadows } from "@/src/constants/theme";
import { useRef, useState, type RefObject } from "react";
import { PanResponder, View } from "react-native";

import { Caption, H3 } from "./Typography";

const THUMB_SIZE = 22;

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
};

/** PanResponder.create runs once (it lives inside a useRef initializer), so
 * its handlers permanently close over whatever `trackWidth`/`onChange` were
 * on the first render — without the `latest` ref they'd always see
 * trackWidth = 0 and every touch would resolve to `min`. Reading through a
 * ref that's updated every render keeps the handlers current. */
function useSliderPanResponder(
  trackWidth: number,
  min: number,
  max: number,
  pageX: RefObject<number>,
  onChange: (value: number) => void,
) {
  const latest = useRef({ trackWidth, min, max, onChange });
  latest.current = { trackWidth, min, max, onChange };

  function positionToValue(x: number) {
    const { trackWidth, min, max } = latest.current;
    if (trackWidth <= 0 || max === min) return min;
    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    return Math.round(min + ratio * (max - min));
  }

  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, gesture) =>
        latest.current.onChange(positionToValue(gesture.x0 - pageX.current)),
      onPanResponderMove: (_e, gesture) =>
        latest.current.onChange(positionToValue(gesture.moveX - pageX.current)),
    }),
  ).current;
}

/** Draggable 1-track slider with a floating value label above the thumb —
 * shared by the pre-session form's slider questions
 * (FormQuestionField.tsx) and the post-session RPE rating. */
export function Slider({
  value,
  min,
  max,
  minLabel,
  maxLabel,
  onChange,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const containerRef = useRef<View>(null);
  const pageX = useRef(0);
  const panResponder = useSliderPanResponder(
    trackWidth,
    min,
    max,
    pageX,
    onChange,
  );

  const ratio = max === min ? 0 : (value - min) / (max - min);
  const thumbCenter = trackWidth * ratio;
  const labelLeft = Math.min(
    Math.max(thumbCenter - labelWidth / 2, 0),
    Math.max(trackWidth - labelWidth, 0),
  );

  return (
    <View>
      <View style={{ height: 34 }}>
        <H3
          onLayout={(e) => setLabelWidth(e.nativeEvent.layout.width)}
          className="text-brand-orange"
          style={{ position: "absolute", left: labelLeft }}>
          {value}
        </H3>
      </View>

      <View
        ref={containerRef}
        onLayout={(e) => {
          setTrackWidth(e.nativeEvent.layout.width);
          containerRef.current?.measure((_x, _y, _w, _h, pgX) => {
            pageX.current = pgX;
          });
        }}
        {...panResponder.panHandlers}
        className="justify-center"
        style={{ height: 32 }}>
        <View className="bg-surface-3 rounded-full" style={{ height: 4 }} />
        <View
          className="bg-brand-orange absolute rounded-full"
          style={{ height: 4, width: thumbCenter }}
        />
        <View
          pointerEvents="none"
          className="absolute rounded-full bg-white"
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              left: thumbCenter - THUMB_SIZE / 2,
            },
            shadows.sm,
          ]}
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Caption>{minLabel ?? min}</Caption>
        <Caption>{maxLabel ?? max}</Caption>
      </View>
    </View>
  );
}
