"use client";

import { cn } from "@/src/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface PortalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function PortalInput({ label, error, className, id, ...props }: PortalInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-portal-text2">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-9 w-full rounded-lg border border-portal-border bg-portal-card px-3 text-sm text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange focus:outline-none focus:ring-1 focus:ring-portal-orange",
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

export function PortalTextarea({ label, error, className, id, ...props }: PortalTextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-portal-text2">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full rounded-lg border border-portal-border bg-portal-card px-3 py-2.5 text-sm text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange focus:outline-none focus:ring-1 focus:ring-portal-orange",
          error && "border-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
