import type { FormQuestionWithOptions } from "@hooper/db";
import { Button, Caption, Field, H3, HEADING_FONT } from "@/src/components/ui";
import { bodyFont, colors, shadows } from "@/src/constants/theme";
import { useEffect, useRef, useState } from "react";
import { PanResponder, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export type FormAnswerValue = string | number | boolean;

type FieldProps<T = FormAnswerValue> = {
  question: FormQuestionWithOptions;
  value: T | undefined;
  onChange: (value: FormAnswerValue) => void;
};

function ShortTextField({ question, value, onChange }: FieldProps) {
  return (
    <Field
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
      placeholder={question.description ?? "Your answer"}
      accent={colors.brandOrange}
      multiline
      numberOfLines={3}
    />
  );
}

function StepperField({ question, value, onChange }: FieldProps) {
  const min = question.min_value ?? 0;
  const max = question.max_value ?? null;
  const current = typeof value === "number" ? value : min;

  const [text, setText] = useState(String(current));
  // Keep the text in sync when the value changes from outside (the +/-
  // buttons, or another field resetting the answer) — but not while the
  // user is mid-edit, since that would fight their keystrokes.
  useEffect(() => setText(String(current)), [current]);

  function clamp(n: number) {
    let next = n;
    if (next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  }

  function step(delta: number) {
    onChange(clamp(current + delta));
  }

  function commit(raw: string) {
    const n = Number(raw.replace(/[^0-9.-]/g, ""));
    setText(String(Number.isFinite(n) ? clamp(n) : current));
    if (Number.isFinite(n)) onChange(clamp(n));
  }

  return (
    <View
      className="bg-surface-2 border-border-subtle flex-row items-center justify-between rounded-xl border px-4"
      style={{ minHeight: 64 }}>
      <Pressable
        onPress={() => step(-1)}
        hitSlop={8}
        className="bg-surface-3 h-10 w-10 items-center justify-center rounded-full">
        <Text style={{ fontFamily: bodyFont("700"), fontSize: 20, color: colors.textSecondary }}>−</Text>
      </Pressable>

      <View className="flex-row items-baseline gap-1.5">
        <TextInput
          value={text}
          onChangeText={setText}
          onEndEditing={(e) => commit(e.nativeEvent.text)}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={{
            fontFamily: HEADING_FONT,
            fontSize: 28,
            lineHeight: 28 * 1.15,
            color: colors.textPrimary,
            width: 64,
            padding: 0,
            textAlign: "center",
          }}
        />
        {question.unit ? <Caption>{question.unit}</Caption> : null}
      </View>

      <Pressable
        onPress={() => step(1)}
        hitSlop={8}
        className="bg-brand-orange h-10 w-10 items-center justify-center rounded-full">
        <Text style={{ fontFamily: bodyFont("700"), fontSize: 20, color: colors.textPrimary }}>+</Text>
      </Pressable>
    </View>
  );
}

const THUMB_SIZE = 22;

function SliderField({ question, value, onChange }: FieldProps) {
  const min = question.min_value ?? 1;
  const max = question.max_value ?? 10;
  const current = typeof value === "number" ? value : Math.round((min + max) / 2);

  const [trackWidth, setTrackWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const containerRef = useRef<View>(null);
  const pageX = useRef(0);

  // PanResponder.create runs once (it lives inside a useRef initializer), so
  // its handlers permanently close over whatever `trackWidth`/`onChange` were
  // on the first render — without this ref they'd always see trackWidth = 0
  // and every touch would resolve to `min`. Reading through a ref that's
  // updated every render keeps the handlers current.
  const latest = useRef({ trackWidth, min, max, onChange });
  latest.current = { trackWidth, min, max, onChange };

  function positionToValue(x: number) {
    const { trackWidth, min, max } = latest.current;
    if (trackWidth <= 0 || max === min) return min;
    const ratio = Math.min(1, Math.max(0, x / trackWidth));
    return Math.round(min + ratio * (max - min));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, gesture) =>
        latest.current.onChange(positionToValue(gesture.x0 - pageX.current)),
      onPanResponderMove: (_e, gesture) =>
        latest.current.onChange(positionToValue(gesture.moveX - pageX.current)),
    }),
  ).current;

  const ratio = max === min ? 0 : (current - min) / (max - min);
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
          {current}
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
            { width: THUMB_SIZE, height: THUMB_SIZE, left: thumbCenter - THUMB_SIZE / 2 },
            shadows.sm,
          ]}
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Caption>{question.min_label ?? min}</Caption>
        <Caption>{question.max_label ?? max}</Caption>
      </View>
    </View>
  );
}

function DropdownField({ question, value, onChange }: FieldProps) {
  const [open, setOpen] = useState(false);
  const selected = question.options.find((o) => o.label === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className={`bg-surface-2 flex-row items-center justify-between rounded-xl border px-4 ${
          open ? "border-brand-orange" : "border-border-subtle"
        }`}
        style={{ height: 48 }}>
        <Text
          className={selected ? "text-text-primary" : "text-text-disabled"}
          style={{ fontFamily: bodyFont(selected ? "600" : "400"), fontSize: 15 }}
          numberOfLines={1}>
          {selected ? selected.label : "Select an option"}
        </Text>
        <Svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <Path
            d="M4 6L8 10L12 6"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      {open ? (
        <View className="bg-surface-2 border-border-subtle mt-1.5 overflow-hidden rounded-xl border">
          {question.options.map((option, i) => {
            const isSelected = option.label === value;
            return (
              <Pressable
                key={option.label}
                onPress={() => {
                  onChange(option.label);
                  setOpen(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  i > 0 ? "border-border-subtle border-t" : ""
                } ${isSelected ? "bg-surface-3" : ""}`}>
                <Text
                  className={isSelected ? "text-brand-orange" : "text-text-primary"}
                  style={{ fontFamily: bodyFont(isSelected ? "600" : "400"), fontSize: 15 }}>
                  {option.label}
                </Text>
                {isSelected ? (
                  <Svg width={16} height={16} viewBox="0 0 18 18" fill="none">
                    <Path
                      d="M3 9l4.5 4.5L15 5"
                      stroke={colors.brandOrange}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function YesNoField({ value, onChange }: FieldProps) {
  const isYes = value === true;
  const isNo = value === false;
  return (
    <View className="flex-row gap-2">
      {(["Yes", "No"] as const).map((label) => {
        const selected = label === "Yes" ? isYes : isNo;
        return (
          <Button
            key={label}
            variant={selected ? "primary" : "secondary"}
            size="md"
            className="flex-1"
            onPress={() => onChange(label === "Yes")}>
            {label}
          </Button>
        );
      })}
    </View>
  );
}

/** Runtime renderer for a form_questions row — the coach-side builder
 * (apps/web) only ever builds these, it never fills one in, so this is new:
 * one small component per FormQuestionType, dispatched by type below. */
export function FormQuestionField(props: FieldProps) {
  switch (props.question.type) {
    case "short_text":
      return <ShortTextField {...props} />;
    case "number":
      return <StepperField {...props} />;
    case "slider":
      return <SliderField {...props} />;
    case "dropdown":
      return <DropdownField {...props} />;
    case "yes_no":
      return <YesNoField {...props} />;
  }
}
