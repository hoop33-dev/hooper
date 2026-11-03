"use client";

import { XIcon } from "@/src/components/icons";
import { Title } from "@/src/components/ui/primitives";
import { cn } from "@/src/lib/cn";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Design `BSheet`: a centred dialog on desktop, a bottom sheet on mobile.
 * Closes on Esc and backdrop click unless `locked` (e.g. while saving). */
export function Sheet({
  title,
  sub,
  onClose,
  locked,
  foot,
  children,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  locked?: boolean;
  foot: ReactNode;
  children: ReactNode;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, onClose]);

  return createPortal(
    <div
      onClick={() => !locked && onClose()}
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center transition-colors duration-220 ease-out md:items-center",
        on ? "bg-ink/45" : "bg-ink/0",
      )}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-bp-card flex max-h-[92%] w-full flex-col rounded-t-[20px] font-sans shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-[transform,opacity] duration-250 ease-out md:w-[480px] md:rounded-[14px]",
          on ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}>
        <div className="flex items-start gap-3 px-[22px] pt-5 pb-3.5">
          <div className="min-w-0 flex-1">
            <Title className="text-[22px]">{title}</Title>
            {sub && <div className="text-bp-text2 mt-1 text-[13px]">{sub}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            aria-label="Close"
            className="border-bp-border bg-bp-card text-bp-text2 flex size-[30px] shrink-0 items-center justify-center rounded-lg border disabled:opacity-50">
            <XIcon size={14} />
          </button>
        </div>
        <div className="overflow-y-auto px-[22px] pb-[18px]">{children}</div>
        <div className="border-bp-border flex justify-end gap-2 border-t px-[22px] py-3.5">
          {foot}
        </div>
      </div>
    </div>,
    document.body,
  );
}
