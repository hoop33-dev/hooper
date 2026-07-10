"use client";

import { useEffect, type MouseEvent } from "react";

function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return ![
      "button",
      "checkbox",
      "radio",
      "submit",
      "reset",
      "range",
      "color",
      "file",
    ].includes(type);
  }
  return (el as HTMLElement).isContentEditable;
}

/**
 * Closes a modal on backdrop click or Escape. Escape is ignored while focus
 * is in a text input, so it doesn't fight the field's own behavior (e.g.
 * clearing an autocomplete) instead of dismissing the modal.
 */
export function useModalDismiss(onClose: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || isTextInput(document.activeElement)) return;
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  };
}
