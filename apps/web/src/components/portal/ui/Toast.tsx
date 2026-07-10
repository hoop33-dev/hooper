"use client";

import { cn } from "@/src/lib/cn";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "error" | "success";
type ToastItem = { id: number; message: string; variant: ToastVariant };

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 0;
const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const showError = useCallback((m: string) => show(m, "error"), [show]);
  const showSuccess = useCallback((m: string) => show(m, "success"), [show]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto max-w-sm cursor-pointer rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg",
              t.variant === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-portal-border bg-portal-card text-portal-text1",
            )}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Must be called within a ToastProvider (mounted once in PortalLayout). */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
