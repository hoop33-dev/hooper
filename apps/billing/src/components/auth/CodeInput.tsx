"use client";

import { cn } from "@/src/lib/cn";
import { useRef, useState } from "react";

export const CODE_LENGTH = 6;

/** Keeps only digits and caps at the code length — what the hidden input
 * accepts from typing, paste or one-time-code autofill. */
export function normaliseCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/** Six visual boxes backed by one real input, so paste, SMS/email autofill
 * (autocomplete="one-time-code"), backspace and screen readers all behave
 * like a normal text field. The box at the caret glows orange (CodeBoxes in
 * the design). */
export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split("");

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          const next = normaliseCode(e.target.value);
          onChange(next);
          if (next.length === CODE_LENGTH) onComplete?.(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit verification code"
        aria-invalid={invalid || undefined}
        maxLength={CODE_LENGTH}
        disabled={disabled}
        autoFocus
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
      <div aria-hidden="true" className="grid grid-cols-6 gap-1.5 md:gap-2.5">
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const current =
            focused && i === Math.min(digits.length, CODE_LENGTH - 1);
          return (
            <div
              key={i}
              className={cn(
                "font-title flex h-[52px] items-center justify-center rounded-[10px] border-[1.5px] text-[26px] font-extrabold text-white md:h-[58px] md:text-[30px]",
                current
                  ? "border-orange bg-orange/8 shadow-[0_0_12px_rgba(241,88,37,0.25)]"
                  : "border-white/10 bg-white/[0.04]",
                invalid && !current && "border-danger/60",
              )}>
              {digits[i] ??
                (current ? (
                  <span className="bg-orange h-6 w-0.5 animate-pulse" />
                ) : (
                  ""
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
