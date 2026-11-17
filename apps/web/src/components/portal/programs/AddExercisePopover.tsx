"use client";

import { cn } from "@/src/lib/cn";
import type {
  ExerciseWithDetails,
  LibrarySequenceWithDetails,
} from "@hooper/db";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SequenceChainText } from "../sequences/SequenceChain";
import { useSequenceSupport } from "../sequences/SequenceSupportContext";
import { ChainIcon, PlusIcon } from "../ui/icons";
import { matchesSearch } from "../ui/ListToolbar";
import { filterExercises } from "./exerciseFilter";

interface AddExercisePopoverProps {
  exercises: ExerciseWithDetails[];
  onAdd: (exerciseId: string) => void;
  /** Enables the Sequence tab: a library sequence id, or none for a blank
   * one. */
  onAddSequence?: (sequenceId?: string) => void;
}

function SequenceResults({
  sequences,
  search,
  onSelect,
}: {
  sequences: LibrarySequenceWithDetails[];
  search: string;
  onSelect: (id?: string) => void;
}) {
  const filtered = sequences.filter((s) => matchesSearch(search, s.name));
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="border-portal-border hover:bg-portal-orange-soft flex w-full items-center gap-2 border-b px-2.5 py-2 text-left">
        <span className="bg-portal-orange flex h-5 w-5 shrink-0 items-center justify-center rounded text-white">
          <PlusIcon size={11} />
        </span>
        <span className="text-portal-text1 text-xs font-bold">
          Build a new sequence
        </span>
      </button>
      {filtered.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(s.id);
          }}
          className="hover:bg-portal-bg block w-full px-2.5 py-1.5 text-left">
          <span className="text-portal-text1 block truncate text-xs font-semibold">
            {s.name}
          </span>
          <SequenceChainText sequence={s} className="text-[10.5px]" />
        </button>
      ))}
      {filtered.length === 0 && sequences.length > 0 && (
        <div className="text-portal-text3 px-2.5 py-3 text-center text-[11px]">
          No results
        </div>
      )}
    </>
  );
}

function ResultsList({
  exercises,
  onSelect,
}: {
  exercises: ExerciseWithDetails[];
  onSelect: (id: string) => void;
}) {
  if (exercises.length === 0) {
    return (
      <div className="text-portal-text3 px-2.5 py-3 text-center text-[11px]">
        No results
      </div>
    );
  }
  return (
    <>
      {exercises.map((ex) => (
        <button
          key={ex.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ex.id);
          }}
          className="hover:bg-portal-bg text-portal-text1 block w-full truncate px-2.5 py-1.5 text-left text-xs">
          {ex.name}
        </button>
      ))}
    </>
  );
}

type AddTab = "exercise" | "sequence";

function AddTabs({
  tab,
  onChange,
}: {
  tab: AddTab;
  onChange: (tab: AddTab) => void;
}) {
  return (
    <div className="border-portal-border flex gap-1 border-b p-1.5">
      {(
        [
          ["exercise", "Exercise"],
          ["sequence", "Sequence"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange(id);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-bold",
            tab === id
              ? "bg-portal-orange text-white"
              : "text-portal-text3 hover:bg-portal-bg",
          )}>
          {id === "sequence" && <ChainIcon size={11} />}
          {label}
        </button>
      ))}
    </div>
  );
}

export function AddExercisePopover({
  exercises,
  onAdd,
  onAddSequence,
}: AddExercisePopoverProps) {
  const support = useSequenceSupport();
  const canAddSequence = !!onAddSequence && !!support;
  const [tab, setTab] = useState<AddTab>("exercise");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Variants are chosen inside the measurement modal, not dragged/added as
  // their own picker rows — only base exercises show up here.
  const baseExercises = exercises.filter((ex) => !ex.parent_id);
  const filtered = filterExercises(baseExercises, search, "");

  // Blocks clip overflow, so a normal absolutely-positioned dropdown gets cut
  // off at the card's edge. Portal it to the body and position it against the
  // trigger's live screen coordinates instead, so it escapes that clipping.
  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  function handleSelect(id: string) {
    onAdd(id);
    setOpen(false);
    setSearch("");
  }

  function handleSelectSequence(id?: string) {
    onAddSequence?.(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="flex-shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="border-portal-border text-portal-text2 hover:bg-portal-bg rounded-full border px-2.5 py-1 text-[11px] font-semibold">
        + Add
      </button>
      {open &&
        position &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <div
              style={{ top: position.top, right: position.right }}
              className="border-portal-border bg-portal-card fixed z-41 w-64 overflow-hidden rounded-lg border shadow-lg">
              {canAddSequence && <AddTabs tab={tab} onChange={setTab} />}
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={
                  tab === "sequence" ? "Search sequences…" : "Search exercises…"
                }
                className="border-portal-border text-portal-text1 w-full border-b px-2.5 py-2 text-xs outline-none"
              />
              <div className="max-h-56 overflow-y-auto">
                {canAddSequence && tab === "sequence" ? (
                  <SequenceResults
                    sequences={support.sequences}
                    search={search}
                    onSelect={handleSelectSequence}
                  />
                ) : (
                  <ResultsList exercises={filtered} onSelect={handleSelect} />
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
