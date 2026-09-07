"use client";

import { cn } from "@/src/lib/cn";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

/** Open state + outside-click-to-close for a dropdown. `anchorRef` goes on
 * the trigger element; `panelRef` on the (portaled) panel — both are
 * consulted so clicking inside either one doesn't count as "outside". */
export function useDropdown() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  return { open, setOpen, anchorRef, panelRef };
}

export function DropdownTrigger({
  anchorRef,
  onClick,
  disabled,
  children,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      ref={anchorRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-portal-border bg-portal-card text-portal-text2 hover:border-portal-orange flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-60">
      <span className="truncate text-left">{children}</span>
      <svg
        className="text-portal-text3 h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor">
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

/** Renders its children into a portal at `document.body`, positioned
 * (`fixed`) under `anchorRef`'s trigger element. Escaping the DOM this way
 * keeps the panel from being clipped by a scrollable/overflow-hidden
 * ancestor (e.g. a modal's scrolling column) and lets it float above
 * whatever comes after it in the page. */
export function DropdownPanel({
  anchorRef,
  panelRef,
  children,
}: {
  anchorRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  // opacity (not visibility) while unpositioned — a visibility:hidden
  // ancestor blocks the search input's autoFocus from taking effect (the
  // browser won't focus an element that isn't visible), but an
  // opacity:0 one doesn't, so autoFocus still wins the very first paint.
  const [style, setStyle] = useState<CSSProperties>({
    opacity: 0,
    pointerEvents: "none",
  });

  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 4;
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Flip to open upward only when there's genuinely not enough room
      // below AND more room above than below — otherwise keep the default
      // (below) rather than flip into an equally cramped space.
      const openUpward =
        spaceBelow < panelHeight + margin && spaceAbove > spaceBelow;

      setStyle(
        openUpward
          ? {
              position: "fixed",
              bottom: window.innerHeight - rect.top + margin,
              left: rect.left,
              width: rect.width,
            }
          : {
              position: "fixed",
              top: rect.bottom + margin,
              left: rect.left,
              width: rect.width,
            },
      );
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorRef, panelRef]);

  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className="border-portal-border bg-portal-card z-[60] overflow-hidden rounded-xl border shadow-lg">
      {children}
    </div>,
    document.body,
  );
}

export function DropdownSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="p-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-portal-border text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-8 w-full rounded-lg border px-3 text-sm focus:outline-none"
      />
    </div>
  );
}

/** Scrollable wrapper for a dropdown's option rows. Caps height to roughly
 * 6 rows (with a sliver of the next one peeking through as a scroll hint)
 * so a long list — many categories, styles, or exercises — never pushes
 * the panel past the viewport. */
export function DropdownList({ children }: { children: ReactNode }) {
  return <div className="max-h-56 overflow-y-auto py-1">{children}</div>;
}

interface DropdownListItemProps {
  label: string;
  selected: boolean;
  /** "checkbox" for multi-select lists, "checkmark" for single-select. */
  variant: "checkbox" | "checkmark";
  hasChildren?: boolean;
  isExpanded?: boolean;
  indent?: boolean;
  onSelect: () => void;
  onExpand?: () => void;
}

export function DropdownListItem({
  label,
  selected,
  variant,
  hasChildren = false,
  isExpanded = false,
  indent = false,
  onSelect,
  onExpand,
}: DropdownListItemProps) {
  return (
    <div
      className={cn(
        "hover:bg-portal-bg flex cursor-pointer items-center gap-2 px-3 py-2",
        indent && "pl-8",
      )}
      onClick={onSelect}>
      {variant === "checkbox" ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="accent-portal-orange h-3.5 w-3.5 rounded"
        />
      ) : (
        <span className="text-portal-text1 w-3.5 shrink-0 text-center text-xs">
          {selected && "✓"}
        </span>
      )}
      <span className="text-portal-text1 flex-1 text-sm">{label}</span>
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand?.();
          }}
          className="text-portal-text3 hover:text-portal-text2">
          <svg
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90",
            )}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Inline "+ Add {itemLabel}" row for creating a new option without leaving
 * the dropdown. Render inside a `DropdownPanel` footer. */
export function DropdownAddRow({
  itemLabel,
  onCreate,
}: {
  itemLabel: string;
  onCreate: (
    name: string,
  ) => Promise<{ ok: boolean; error?: string } | undefined>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    const result = await onCreate(trimmed);
    setSaving(false);
    if (result && !result.ok) {
      setError(result.error ?? `Couldn't create ${itemLabel}.`);
      return;
    }
    setName("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-portal-orange hover:bg-portal-bg flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-semibold">
        <span className="text-base leading-none">+</span> Add {itemLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setAdding(false);
              setName("");
            }
          }}
          placeholder={`New ${itemLabel} name…`}
          className="border-portal-border text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-8 min-w-0 flex-1 rounded-lg border px-2.5 text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !name.trim()}
          title={`Add ${itemLabel}`}
          className="bg-portal-orange flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50">
          {saving ? (
            <span
              role="status"
              aria-label="Saving"
              className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
            />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.415l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 111.415-1.415L8.5 12.086l6.79-6.796a1 1 0 011.415 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
