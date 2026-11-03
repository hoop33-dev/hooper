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
type ToastAction = { label: string; onClick: () => void };
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  /** No auto-dismiss timer while true. */
  sticky?: boolean;
};

/** Handle for a toast that stays put until you finish it — for work that
 * runs longer than the auto-dismiss window (e.g. generating a PDF). */
export type StickyToast = {
  /** Swap the message, optionally attach an action button, and (unless an
   * action is attached) re-arm the auto-dismiss. */
  resolve: (message: string, action?: ToastAction) => void;
  dismiss: () => void;
};

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showSticky: (message: string) => StickyToast;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 0;
const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (
      message: string,
      variant: ToastVariant,
      opts?: { sticky?: boolean },
    ): number => {
      const id = nextToastId++;
      setToasts((prev) => [
        ...prev,
        { id, message, variant, sticky: opts?.sticky },
      ]);
      if (!opts?.sticky) setTimeout(() => dismiss(id), TOAST_DURATION_MS);
      return id;
    },
    [dismiss],
  );

  const showError = useCallback((m: string) => void add(m, "error"), [add]);
  const showSuccess = useCallback((m: string) => void add(m, "success"), [add]);

  const showSticky = useCallback(
    (message: string): StickyToast => {
      const id = add(message, "success", { sticky: true });
      return {
        resolve: (msg, action) => {
          setToasts((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, message: msg, action, sticky: !!action }
                : t,
            ),
          );
          if (!action) setTimeout(() => dismiss(id), TOAST_DURATION_MS);
        },
        dismiss: () => dismiss(id),
      };
    },
    [add, dismiss],
  );

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showSticky }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex max-w-sm cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg",
              t.variant === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-portal-border bg-portal-card text-portal-text1",
            )}>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="bg-portal-orange shrink-0 rounded-md px-2.5 py-1 text-xs font-bold text-white hover:brightness-110">
                {t.action.label}
              </button>
            )}
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
