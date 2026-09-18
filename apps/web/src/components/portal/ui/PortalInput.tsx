"use client";

import { cn } from "@/src/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Classes for the outer wrapper (the actual flex item in a row layout —
   * e.g. "flex-1" to grow horizontally). Passing layout classes like that
   * via `className` instead lands on the <input>, whose wrapper is a
   * flex-col: a flex-basis there fights the vertical axis and can override
   * the input's own explicit height. */
  wrapperClassName?: string;
}

export function PortalInput({
  label,
  error,
  className,
  wrapperClassName,
  id,
  ...props
}: PortalInputProps) {
  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="text-portal-text2 text-xs font-semibold">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange focus:ring-portal-orange h-11 w-full rounded-lg border px-3.5 text-sm focus:ring-1 focus:outline-none",
          error && "border-red-400 focus:border-red-400 focus:ring-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface PortalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function PortalTextarea({
  label,
  error,
  className,
  id,
  ...props
}: PortalTextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-portal-text2 text-xs font-semibold">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange focus:ring-portal-orange w-full rounded-lg border px-3 py-2.5 text-sm focus:ring-1 focus:outline-none",
          error && "border-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
