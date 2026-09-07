import {
  Button,
  Caption,
  Field,
  HEADING_FONT,
  Slider,
} from "@/src/components/ui";
import { bodyFont, colors } from "@/src/constants/theme";
import type { FormQuestionWithOptions } from "@hooper/db";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
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
        <Text
          style={{
            fontFamily: bodyFont("700"),
            fontSize: 20,
            color: colors.textSecondary,
          }}>
          −
        </Text>
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
        <Text
          style={{
            fontFamily: bodyFont("700"),
            fontSize: 20,
            color: colors.textPrimary,
          }}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

function SliderField({ question, value, onChange }: FieldProps) {
  const min = question.min_value ?? 1;
  const max = question.max_value ?? 10;
  const current =
    typeof value === "number" ? value : Math.round((min + max) / 2);

  return (
    <Slider
      value={current}
      min={min}
      max={max}
      minLabel={question.min_label ?? undefined}
      maxLabel={question.max_label ?? undefined}
      onChange={onChange}
    />
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
          style={{
            fontFamily: bodyFont(selected ? "600" : "400"),
            fontSize: 15,
          }}
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
                  className={
                    isSelected ? "text-brand-orange" : "text-text-primary"
                  }
                  style={{
                    fontFamily: bodyFont(isSelected ? "600" : "400"),
                    fontSize: 15,
                  }}>
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

/** The cosmetic starting value each field type shows before the athlete
 * touches it — StepperField's min, SliderField's midpoint (kept in sync with
 * those components' own fallback math). ShortTextField/DropdownField/
 * YesNoField render unselected/empty with no value, so have nothing
 * meaningful to default to. */
export function defaultAnswerForQuestion(
  question: FormQuestionWithOptions,
): FormAnswerValue | undefined {
  switch (question.type) {
    case "number":
      return question.min_value ?? 0;
    case "slider": {
      const min = question.min_value ?? 1;
      const max = question.max_value ?? 10;
      return Math.round((min + max) / 2);
    }
    case "short_text":
    case "dropdown":
    case "yes_no":
      return undefined;
  }
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
