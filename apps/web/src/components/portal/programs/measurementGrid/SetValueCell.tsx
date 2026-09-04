"use client";

import { cn } from "@/src/lib/cn";
import { useEffect, useState } from "react";

/**
 * Number entry that allows the field to be blank while typing and coerces to
 * `min` on blur, with the native up/down spinner arrows hidden.
 */
export function StepperInput({
  value,
  min,
  onChange,
  className,
  dataSetIndex,
  dataSlotIndex,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
  className: string;
  /** Set on a set-value cell (not the Sets stepper) — identifies this input
   * for the modal's delegated Tab/Enter/Shift+Enter keyboard handling. */
  dataSetIndex?: number;
  dataSlotIndex?: number;
}) {
  const [text, setText] = useState(String(value));
  // Keep the field in sync when value changes elsewhere (e.g. +/- buttons).
  useEffect(() => setText(String(value)), [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next === "") return; // allow transient blank while typing
        const parsed = Number(next);
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        const parsed = Number(text);
        const resolved =
          text === "" || Number.isNaN(parsed) ? min : Math.max(min, parsed);
        onChange(resolved);
        setText(String(resolved));
      }}
      onFocus={(e) => e.currentTarget.select()}
      data-role={dataSetIndex !== undefined ? "set-value" : undefined}
      data-set-index={dataSetIndex}
      data-slot-index={dataSlotIndex}
      className={cn(
        "[appearance:textfield] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
    />
  );
}

/** Custom-drawn instead of relying on the native checkbox: browsers render
 * an unstyled unchecked `accent-color` checkbox as a solid black square, not
 * an empty box. Small enough to sit inside a single set's cell. */
export function AthleteEnteredBadge({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onChange(!checked)}
      title={
        checked
          ? "Athlete enters this set — click to plan a number instead"
          : "Let the athlete enter this set"
      }
      className={cn(
        "absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border text-[8px] font-black",
        checked
          ? "border-portal-orange bg-portal-orange text-white"
          : "border-portal-border bg-portal-card text-portal-text3",
      )}>
      A
    </button>
  );
}

/** One unit-type slot's value cell within a set — a small labeled box
 * (e.g. "SHOTS" / 10) with the athlete-entered toggle in the corner. */
export function SetValueCell({
  label,
  value,
  athleteEntered,
  onChangeValue,
  onToggleAthlete,
  dataSetIndex,
  dataSlotIndex,
}: {
  label: string;
  value: number;
  athleteEntered: boolean;
  onChangeValue: (v: number) => void;
  onToggleAthlete: (v: boolean) => void;
  dataSetIndex: number;
  dataSlotIndex: number;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-portal-text3 text-[9px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="border-portal-border bg-portal-card relative flex h-9 w-full min-w-16 items-center justify-center rounded-lg border py-1.5">
        {athleteEntered ? (
          <span className="text-portal-text3 text-[10px] italic">Athlete</span>
        ) : (
          <StepperInput
            value={value}
            min={0}
            onChange={onChangeValue}
            dataSetIndex={dataSetIndex}
            dataSlotIndex={dataSlotIndex}
            className="font-title text-portal-orange w-full text-center text-base font-black"
          />
        )}
        <AthleteEnteredBadge
          checked={athleteEntered}
          onChange={onToggleAthlete}
        />
      </div>
    </div>
  );
}
