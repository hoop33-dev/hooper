"use client";

import { cn } from "@/src/lib/cn";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { BookmarkIcon, SpinnerIcon, XIcon } from "../ui/icons";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { PortalButton } from "../ui/PortalButton";
import { useModalDismiss } from "../ui/useModalDismiss";
import { AddExercisePopover } from "./AddExercisePopover";
import {
  useDragIndicator,
  type DragIndicator,
} from "./dnd/DragIndicatorContext";
import { isPending } from "./dnd/pendingRows";
import { SortableBlockExerciseRow } from "./dnd/SortableBlockExerciseRow";

type BlockDropVisual = {
  headerLineEdge: "bottom" | null;
  emptyHighlight: boolean;
};

/** A block/template hovering this card reorders whole blocks — that cue now
 * lives on the gap either side of the card (see BlockGapDropZone), not on
 * the card itself, so it's excluded here entirely. A block card only shows
 * its own cue for an exercise/library drop: a header-bottom line (it goes
 * first in the block) or a fill highlight for an empty block, which has no
 * row to anchor a line to. */
function computeBlockDropVisual(
  blockDomId: string,
  hasExercises: boolean,
  indicator: DragIndicator,
): BlockDropVisual {
  const activeId = indicator.activeId ?? "";
  if (!activeId || indicator.overId !== blockDomId)
    return { headerLineEdge: null, emptyHighlight: false };

  const isBlockLikeDrag =
    activeId.startsWith("block:") ||
    activeId.startsWith("block-template:") ||
    activeId.startsWith("session-template:");
  if (isBlockLikeDrag) return { headerLineEdge: null, emptyHighlight: false };

  return {
    headerLineEdge: hasExercises ? "bottom" : null,
    emptyHighlight: !hasExercises,
  };
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
      <circle cx="2.5" cy="2.5" r="1.3" />
      <circle cx="2.5" cy="7" r="1.3" />
      <circle cx="2.5" cy="11.5" r="1.3" />
      <circle cx="7.5" cy="2.5" r="1.3" />
      <circle cx="7.5" cy="7" r="1.3" />
      <circle cx="7.5" cy="11.5" r="1.3" />
    </svg>
  );
}

export type BlockSettingsPatch = { is_superset?: boolean; sets?: number };

/** Toggles a block between "each exercise has its own sets" and "superset"
 * (a shared round count applied to every exercise in it) — see
 * BlockExerciseMeasurementModal for straight-set/pyramid editing and
 * SupersetRoundsModal for editing a superset's shared rounds. */
function SupersetControl({
  block,
  onUpdateBlock,
}: {
  block: BlockWithExercises;
  onUpdateBlock: (patch: BlockSettingsPatch) => void;
}) {
  if (!block.is_superset) {
    return (
      <button
        type="button"
        onClick={() =>
          onUpdateBlock({
            is_superset: true,
            sets: Math.max(1, ...block.exercises.map((e) => e.sets)),
          })
        }
        onPointerDown={(e) => e.stopPropagation()}
        title="Make this block a superset — a shared round count for every exercise in it"
        className="border-portal-border text-portal-text3 hover:border-portal-orange hover:text-portal-orange flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        Superset
      </button>
    );
  }

  const sets = block.sets ?? 1;
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="border-portal-orange bg-portal-orange-soft flex flex-shrink-0 items-center gap-1.5 rounded border px-1.5 py-0.5">
      <button
        type="button"
        onClick={() => onUpdateBlock({ is_superset: false })}
        title="Un-superset — let each exercise have its own sets again"
        className="text-portal-orange text-[10px] font-bold">
        Superset
      </button>
      <span className="bg-portal-orange/30 h-3 w-px" />
      <button
        type="button"
        onClick={() => onUpdateBlock({ sets: Math.max(1, sets - 1) })}
        title="Fewer rounds"
        className="text-portal-orange w-3 text-center text-xs leading-none font-bold">
        −
      </button>
      <span className="text-portal-orange w-4 text-center text-[11px] font-extrabold">
        {sets}
      </span>
      <button
        type="button"
        onClick={() => onUpdateBlock({ sets: sets + 1 })}
        title="More rounds"
        className="text-portal-orange w-3 text-center text-xs leading-none font-bold">
        +
      </button>
    </div>
  );
}

/** Superset settings edited as a modal rather than inline — the dense
 * program-canvas card (~220px wide) has no room for the full-size inline
 * toggle + stepper SupersetControl renders. */
function BlockSettingsModal({
  block,
  onClose,
  onSave,
}: {
  block: BlockWithExercises;
  onClose: () => void;
  onSave: (patch: BlockSettingsPatch) => void;
}) {
  const [isSuperset, setIsSuperset] = useState(block.is_superset);
  const [sets, setSets] = useState(
    block.sets ?? Math.max(1, ...block.exercises.map((e) => e.sets)),
  );
  const onBackdropClick = useModalDismiss(onClose);

  function handleSave() {
    onSave(isSuperset ? { is_superset: true, sets } : { is_superset: false });
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="bg-portal-card flex w-full max-w-xs flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-title text-portal-text1 text-[15px] font-extrabold tracking-wide">
            {block.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border-portal-border text-portal-text2 flex h-7 w-7 items-center justify-center rounded-full border">
            <XIcon />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 px-4 py-4">
          <button
            type="button"
            onClick={() => setIsSuperset((v) => !v)}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left",
              isSuperset
                ? "border-portal-orange bg-portal-orange-soft"
                : "border-portal-border",
            )}>
            <span
              className={cn(
                "text-xs font-bold",
                isSuperset ? "text-portal-orange" : "text-portal-text1",
              )}>
              Superset
            </span>
            <span className="text-portal-text3 text-[11px]">
              {isSuperset ? "On — shared rounds" : "Off — click to enable"}
            </span>
          </button>
          {isSuperset && (
            <div className="flex items-center gap-3">
              <span className="text-portal-text2 w-14 flex-shrink-0 text-xs font-bold">
                Rounds
              </span>
              <div className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSets((v) => Math.max(1, v - 1))}
                  className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
                  −
                </button>
                <span className="font-title text-portal-text1 flex-1 text-center text-lg font-black">
                  {sets}
                </span>
                <button
                  type="button"
                  onClick={() => setSets((v) => v + 1)}
                  className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
                  +
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="border-portal-border bg-portal-bg flex flex-shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
          <PortalButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </PortalButton>
          <PortalButton variant="primary" size="sm" onClick={handleSave}>
            Save
          </PortalButton>
        </div>
      </div>
    </div>
  );
}

/** Dense-mode sibling of SupersetControl: a small badge (always visible
 * once a block is a superset, so the program canvas shows the indicator the
 * full session view already has) that opens BlockSettingsModal rather than
 * rendering the toggle + stepper inline. */
function SupersetIndicator({
  block,
  onUpdateBlock,
}: {
  block: BlockWithExercises;
  onUpdateBlock: (patch: BlockSettingsPatch) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={
          block.is_superset
            ? `Superset — ${block.sets ?? 1} shared rounds`
            : "Make this block a superset"
        }
        className={cn(
          "flex-shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold transition-all duration-200 ease-out",
          block.is_superset
            ? "border-portal-orange bg-portal-orange-soft text-portal-orange translate-x-0 opacity-100"
            : // Rests shifted right and invisible (rather than fading in
              // place, which left it looking like an unanchored gap next to
              // the name) and slides left into position on hover/focus.
              "border-portal-border text-portal-text3 translate-x-2 opacity-0 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100",
        )}>
        {block.is_superset ? `×${block.sets ?? 1}` : "Superset"}
      </button>
      {open && (
        <BlockSettingsModal
          block={block}
          onClose={() => setOpen(false)}
          onSave={(patch) => {
            onUpdateBlock(patch);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function BlockNameField({
  name,
  color,
  readOnly,
  onRename,
}: {
  name: string;
  color: string;
  readOnly?: boolean;
  onRename: (name: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    setRenaming(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraft(name);
  }

  if (renaming) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="border-portal-orange bg-portal-card text-portal-text1 min-w-0 flex-1 rounded border px-1.5 py-0.5 text-[13px] font-bold outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => !readOnly && setRenaming(true)}
      title={readOnly ? undefined : "Click to rename"}
      style={{ color }}
      className={cn(
        "-mx-1 min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-[13px] font-bold",
        !readOnly && "hover:bg-portal-border/50",
      )}>
      {name}
    </button>
  );
}

interface BlockCardHeaderProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  pending?: boolean;
  dense?: boolean;
  dragHandleProps?: Record<string, unknown>;
  dropLineEdge?: "bottom" | null;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSaveAsTemplate?: () => void;
  onUpdateBlock?: (patch: BlockSettingsPatch) => void;
  addExercise?: {
    exercises: ExerciseWithDetails[];
    onAdd: (id: string) => void;
  };
}

/** Picks the dense-vs-full superset control so BlockCardHeader itself only
 * has a single flat condition to render it, rather than a nested ternary
 * (keeps BlockCardHeader's own branching under the lint's complexity cap). */
function SupersetSlot({
  block,
  dense,
  onUpdateBlock,
}: {
  block: BlockWithExercises;
  dense?: boolean;
  onUpdateBlock: (patch: BlockSettingsPatch) => void;
}) {
  return dense ? (
    <SupersetIndicator block={block} onUpdateBlock={onUpdateBlock} />
  ) : (
    <SupersetControl block={block} onUpdateBlock={onUpdateBlock} />
  );
}

function SaveAsTemplateAction({
  onSaveAsTemplate,
}: {
  onSaveAsTemplate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSaveAsTemplate}
      onPointerDown={(e) => e.stopPropagation()}
      title="Save as template"
      className="text-portal-text3 hover:text-portal-orange flex-shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
      <BookmarkIcon />
    </button>
  );
}

function DeleteBlockAction({ onDelete }: { onDelete: () => void }) {
  return (
    <InlineConfirmDelete
      onDelete={onDelete}
      idleTitle="Delete block"
      idleClassName="text-portal-text3 opacity-0 hover:text-red-500 group-focus-within:opacity-100 group-hover:opacity-100"
    />
  );
}

/** Everything after the name field — extracted from BlockCardHeader so its
 * branching (dense vs. full ordering, and which actions this render even
 * has) stays under the lint's complexity cap. In the full/session header
 * the superset control sits right after the name, ahead of "+ Add"/save/
 * delete — unchanged from before. The dense program-canvas card has no
 * "+ Add" and its save/delete icons stay invisible until hover, so putting
 * the superset badge there too (last, not right after the name) is what
 * keeps it flush against the card's true right edge instead of stranded
 * mid-row with dead hover-reserved space trailing after it. */
function BlockCardHeaderActions({
  block,
  dense,
  onSaveAsTemplate,
  onUpdateBlock,
  onDelete,
  addExercise,
}: Pick<
  BlockCardHeaderProps,
  | "block"
  | "dense"
  | "onSaveAsTemplate"
  | "onUpdateBlock"
  | "onDelete"
  | "addExercise"
>) {
  return (
    <>
      {!dense && onUpdateBlock && (
        <SupersetSlot block={block} onUpdateBlock={onUpdateBlock} />
      )}
      {addExercise && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <AddExercisePopover
            exercises={addExercise.exercises}
            onAdd={addExercise.onAdd}
          />
        </div>
      )}
      {onSaveAsTemplate && (
        <SaveAsTemplateAction onSaveAsTemplate={onSaveAsTemplate} />
      )}
      <DeleteBlockAction onDelete={onDelete} />
      {dense && onUpdateBlock && (
        <SupersetSlot block={block} dense onUpdateBlock={onUpdateBlock} />
      )}
    </>
  );
}

function BlockCardHeader({
  block,
  readOnly,
  pending,
  dense,
  dragHandleProps,
  dropLineEdge,
  onRename,
  onDelete,
  onSaveAsTemplate,
  onUpdateBlock,
  addExercise,
}: BlockCardHeaderProps) {
  return (
    <div
      className="border-portal-border bg-portal-bg relative flex touch-none items-center gap-2 border-b px-3 py-2"
      {...dragHandleProps}>
      {dropLineEdge && (
        <div className="bg-portal-orange pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5" />
      )}
      <span className="text-portal-text3 flex-shrink-0 cursor-grab active:cursor-grabbing">
        {pending ? <SpinnerIcon size={11} /> : <GripIcon />}
      </span>
      <BlockNameField
        name={block.name}
        color={block.color}
        readOnly={readOnly || pending}
        onRename={onRename}
      />
      {!readOnly && !pending && (
        <BlockCardHeaderActions
          block={block}
          dense={dense}
          onSaveAsTemplate={onSaveAsTemplate}
          onUpdateBlock={onUpdateBlock}
          onDelete={onDelete}
          addExercise={addExercise}
        />
      )}
    </div>
  );
}

interface BlockCardBodyProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  dense?: boolean;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (id: string) => void;
}

function BlockCardBody({
  block,
  readOnly,
  dense,
  onOpenExercise,
  onRemoveExercise,
}: BlockCardBodyProps) {
  return (
    <SortableContext
      items={block.exercises.map((e) => `block-exercise:${e.id}`)}
      strategy={verticalListSortingStrategy}>
      {block.exercises.length === 0 ? (
        <div className="text-portal-text3 px-4 py-5 text-center text-[11px] italic">
          {readOnly ? "No exercises yet" : "Drag an exercise here"}
        </div>
      ) : (
        block.exercises.map((be) => (
          <SortableBlockExerciseRow
            key={be.id}
            blockExercise={be}
            readOnly={readOnly}
            dense={dense}
            onOpen={() => onOpenExercise(be)}
            onRemove={() => onRemoveExercise(be.id)}
          />
        ))
      )}
    </SortableContext>
  );
}

interface BlockCardProps {
  block: BlockWithExercises;
  readOnly?: boolean;
  dense?: boolean;
  exercises?: ExerciseWithDetails[];
  onAddExercise?: (exerciseId: string) => void;
  onOpenExercise: (blockExercise: BlockExerciseWithDetails) => void;
  onRemoveExercise: (id: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSaveAsTemplate?: () => void;
  /** Powers the header's superset control — an inline toggle + rounds
   * stepper outside dense/canvas rendering, or a compact badge that opens
   * BlockSettingsModal in dense rendering, which has no room for the
   * inline version. */
  onUpdateBlock?: (patch: BlockSettingsPatch) => void;
}

export function BlockCard({
  block,
  readOnly,
  dense,
  exercises,
  onAddExercise,
  onOpenExercise,
  onRemoveExercise,
  onRename,
  onDelete,
  onSaveAsTemplate,
  onUpdateBlock,
}: BlockCardProps) {
  const pending = isPending(block);
  const blockDomId = `block:${block.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: blockDomId,
    disabled: pending,
  });
  const { headerLineEdge, emptyHighlight } = computeBlockDropVisual(
    blockDomId,
    block.exercises.length > 0,
    useDragIndicator(),
  );

  // No CSS transform is applied: blocks stay put while dragging so only the
  // insertion line moves, keeping drop targets stable.
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-portal-card border-portal-border group relative overflow-hidden rounded-xl border",
        emptyHighlight && "bg-portal-orange-soft",
        isDragging && "opacity-40",
        pending && "opacity-60",
      )}>
      <BlockCardHeader
        block={block}
        readOnly={readOnly}
        pending={pending}
        dense={dense}
        dragHandleProps={{ ...attributes, ...listeners }}
        dropLineEdge={headerLineEdge}
        onRename={onRename}
        onDelete={onDelete}
        onSaveAsTemplate={onSaveAsTemplate}
        onUpdateBlock={onUpdateBlock}
        addExercise={
          !dense && exercises && onAddExercise
            ? { exercises, onAdd: onAddExercise }
            : undefined
        }
      />
      <BlockCardBody
        block={block}
        readOnly={readOnly}
        dense={dense}
        onOpenExercise={onOpenExercise}
        onRemoveExercise={onRemoveExercise}
      />
    </div>
  );
}
