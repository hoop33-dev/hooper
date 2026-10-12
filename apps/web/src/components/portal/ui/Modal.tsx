"use client";

import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";
import { XIcon } from "./icons";
import { useModalDismiss } from "./useModalDismiss";

const WIDTHS = {
  md: "max-w-lg",
  lg: "max-w-xl",
} as const;

/** Centered modal card with the portal's standard header (title, optional
 * subtitle, close button). Backdrop click and Escape close it. Children
 * supply the body and footer — see `ModalFooter`. */
export function Modal({
  title,
  subtitle,
  width = "md",
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  width?: keyof typeof WIDTHS;
  onClose: () => void;
  children: ReactNode;
}) {
  const onBackdropClick = useModalDismiss(onClose);
  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "bg-portal-card flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl shadow-2xl",
          WIDTHS[width],
        )}>
        <div className="border-portal-border flex flex-shrink-0 items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-portal-text3 truncate text-xs">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="border-portal-border text-portal-text2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border">
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
      {children}
    </div>
  );
}
