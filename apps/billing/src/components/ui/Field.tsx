"use client";

import { EyeIcon, EyeOffIcon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/** The design's `Field` made real: uppercase label, 46px input, optional hint
 * / error and a right slot. `dark` styles it for the auth screens. Password
 * fields get a show/hide eye. */
type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  right?: ReactNode;
  dark?: boolean;
};

const THEME = {
  dark: {
    label: "text-white/45",
    box: "border-white/14 bg-white/5",
    input: "text-white placeholder:text-white/30",
    icon: "text-white/40",
    hint: "text-white/40",
    error: "text-[#F87171]",
  },
  light: {
    label: "text-bp-text3",
    box: "border-bp-border bg-bp-card",
    input: "text-bp-text1 placeholder:text-bp-text3 disabled:text-bp-text2",
    icon: "text-bp-text3",
    hint: "text-bp-text3",
    error: "text-danger",
  },
} as const;

export function Field({
  label,
  hint,
  error,
  right,
  dark,
  type = "text",
  id,
  ...input
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [reveal, setReveal] = useState(false);
  const t = THEME[dark ? "dark" : "light"];
  const isPassword = type === "password";
  const note = error || hint;
  const noteId = note ? `${inputId}-note` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          "text-[10.5px] font-semibold tracking-[0.12em] uppercase",
          t.label,
        )}>
        {label}
      </label>
      <div
        className={cn(
          "focus-within:border-orange flex h-[46px] items-center gap-2.5 rounded-[9px] border px-3.5 transition-colors",
          t.box,
          error && "border-danger focus-within:border-danger",
        )}>
        <input
          id={inputId}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={noteId}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[14.5px] outline-none",
            t.input,
          )}
          {...input}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className={t.icon}>
            {reveal ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
          </button>
        ) : (
          right
        )}
      </div>
      {note && (
        <div
          id={noteId}
          className={cn("text-[11.5px]", error ? t.error : t.hint)}>
          {note}
        </div>
      )}
    </div>
  );
}
