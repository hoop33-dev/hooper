"use client";

import { useState, type ReactNode } from "react";
import { CheckIcon, PlusIcon } from "./icons";
import { matchesSearch } from "./ListToolbar";
import { Modal, ModalFooter } from "./Modal";
import { PortalButton } from "./PortalButton";

type ActionResult = { ok: boolean; error?: string };

export type SearchPickerItem = {
  id: string;
  title: string;
  sub?: ReactNode;
  /** Extra text to match on that isn't the title (e.g. a username). */
  search?: string;
  lead?: ReactNode;
};

/** The one picker behind every "Add X" on the detail pages. Tapping a row
 * adds it and marks it "Added"; the modal stays open so several can be
 * added in one go. */
export function SearchPickerModal({
  title,
  subtitle,
  placeholder,
  items,
  emptyLabel,
  onAdd,
  onClose,
}: {
  title: string;
  subtitle?: string;
  placeholder: string;
  /** Candidates not yet attached. Snapshotted on open: callers filter out
   * attached items, so a live list would drop each row the moment it's
   * added instead of showing it as "Added". */
  items: SearchPickerItem[];
  emptyLabel: string;
  onAdd: (id: string) => Promise<ActionResult>;
  onClose: () => void;
}) {
  const [candidates] = useState(items);
  const [search, setSearch] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const shown = candidates.filter((item) =>
    matchesSearch(
      search,
      item.title,
      typeof item.sub === "string" ? item.sub : undefined,
      item.search,
    ),
  );

  async function add(item: SearchPickerItem) {
    if (added.includes(item.id)) return;
    setAdded((ids) => [...ids, item.id]);
    setError(null);
    const result = await onAdd(item.id);
    if (!result.ok) {
      setAdded((ids) => ids.filter((id) => id !== item.id));
      setError(result.error ?? `Couldn't add ${item.title}.`);
    }
  }

  return (
    <Modal title={title} subtitle={subtitle} width="lg" onClose={onClose}>
      {candidates.length > 0 && (
        <div className="border-portal-border flex-shrink-0 border-b px-6 py-4">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="border-portal-border bg-portal-card text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-11 w-full rounded-[10px] border-[1.5px] px-3.5 text-sm outline-none"
          />
        </div>
      )}
      {error && (
        <p className="flex-shrink-0 border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
      <div className="max-h-[380px] min-h-0 flex-1 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="text-portal-text3 px-6 py-8 text-center text-[13px]">
            {emptyLabel}
          </p>
        ) : shown.length === 0 ? (
          <p className="text-portal-text3 px-6 py-8 text-center text-[13px]">
            No matches for &ldquo;{search}&rdquo;
          </p>
        ) : (
          shown.map((item) => (
            <PickerRow
              key={item.id}
              item={item}
              added={added.includes(item.id)}
              onAdd={() => add(item)}
            />
          ))
        )}
      </div>
      <ModalFooter>
        {added.length > 0 && (
          <span className="text-portal-text3 mr-auto text-xs">
            {added.length} added
          </span>
        )}
        <PortalButton
          variant={added.length > 0 ? "primary" : "secondary"}
          onClick={onClose}>
          {added.length > 0 ? "Done" : "Cancel"}
        </PortalButton>
      </ModalFooter>
    </Modal>
  );
}

function PickerRow({
  item,
  added,
  onAdd,
}: {
  item: SearchPickerItem;
  added: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={added}
      className="border-portal-border hover:bg-portal-bg flex w-full cursor-pointer items-center gap-3.5 border-b px-6 py-3.5 text-left disabled:cursor-default disabled:hover:bg-transparent">
      {item.lead}
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-sm font-bold">
          {item.title}
        </div>
        {item.sub && (
          <div className="text-portal-text3 mt-0.5 truncate text-xs">
            {item.sub}
          </div>
        )}
      </div>
      {added ? (
        <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-[#38A169]">
          <CheckIcon /> Added
        </span>
      ) : (
        <span className="bg-portal-orange-soft text-portal-orange flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border border-[rgba(241,88,37,0.22)]">
          <PlusIcon size={13} />
        </span>
      )}
    </button>
  );
}
