import { cn } from "@/src/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  suffix?: ReactNode;
}

export function Input({
  label,
  id,
  error,
  suffix,
  className,
  ...props
}: InputProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-sm font-medium text-white/70">{label}</span>
      ) : null}
      <div className="relative">
        <input
          id={id}
          className={cn(
            "bg-surface-container-high w-full rounded-xl border px-4 py-3 text-[15px] text-white transition-[border-color,background] duration-[180ms] ease-out placeholder:text-white/35 focus:bg-white/[0.06] focus:outline-none",
            error
              ? "border-red-500/30 focus:border-red-400/50"
              : "border-white/[0.08] focus:border-white/25",
            suffix ? "pr-11" : "",
            className,
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute top-1/2 right-3.5 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </label>
  );
}
