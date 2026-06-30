"use client";

import { cn } from "@/src/lib/cn";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

interface AuthInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix"
> {
  label: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export function AuthInput({
  label,
  id,
  error,
  prefix,
  suffix,
  className,
  onFocus,
  onBlur,
  ...props
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-neutral-dark/55 text-[11px] font-semibold tracking-[0.12em] uppercase"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex h-[52px] items-center rounded-xl border bg-white px-4 transition-[border-color,box-shadow] duration-150",
          error
            ? "border-red-400"
            : focused
              ? "border-primary-orange shadow-[0_0_0_3px_rgba(242,101,34,0.12)]"
              : "border-neutral-dark/15",
        )}
      >
        {prefix && (
          <span className="text-neutral-dark/35 mr-3 shrink-0">{prefix}</span>
        )}
        <input
          id={id}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            "text-neutral-dark placeholder:text-neutral-dark/35 h-full flex-1 bg-transparent text-[15px] focus:outline-none",
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="text-neutral-dark/35 ml-3 shrink-0">{suffix}</span>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
