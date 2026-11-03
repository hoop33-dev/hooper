import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "mb-1.5 text-[10px] font-medium tracking-[0.13em] uppercase",
          error ? "text-red-400" : "text-white/35",
        )}
      >
        {label}
      </span>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="5.5" stroke="#E53E3E" strokeWidth="1" />
            <path
              d="M6 3.5V6.5"
              stroke="#E53E3E"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="6" cy="8.5" r="0.6" fill="#E53E3E" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
