"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseWithDetails,
} from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { BlockCard } from "./BlockCard";
import { NewBlockDropZone } from "./dnd/NewBlockDropZone";
import { sessionDropId } from "./dnd/useBlockExerciseDnd";

interface BlockListProps {
  sessionId: string;
  blocks: BlockWithExercises[];
  exercises: ExerciseWithDetails[];
  onOpenExercise: (be: BlockExerciseWithDetails) => void;
  onRemoveExercise: (exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: (name: string) => Promise<void>;
  onAddExerciseToBlock: (blockId: string, exerciseId: string) => void;
}

function AddBlockForm({
  sessionId,
  onAdd,
}: {
  sessionId: string;
  onAdd: (name: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onAdd(name.trim());
    setSaving(false);
    setName("");
    setAdding(false);
  }

  if (!adding) {
    return (
      <NewBlockDropZone
        sessionId={sessionId}
        className="border-portal-border-mid rounded-xl border border-dashed">
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-portal-text3 w-full py-3 text-center text-sm font-semibold">
          + Add block
          <span className="block text-xs font-normal">
            or drag an exercise here
          </span>
        </button>
      </NewBlockDropZone>
    );
  }

  return (
    <div className="border-portal-border bg-portal-card flex items-center gap-2 rounded-xl border p-3">
      <PortalInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Block name, e.g. Warm-Up"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="flex-1"
      />
      <PortalButton
        size="sm"
        variant="ghost"
        onClick={() => setAdding(false)}
        disabled={saving}>
        Cancel
      </PortalButton>
      <PortalButton
        size="sm"
        variant="primary"
        onClick={handleSubmit}
        disabled={saving || !name.trim()}>
        {saving ? "Adding…" : "Add"}
      </PortalButton>
    </div>
  );
}

export function BlockList({
  sessionId,
  blocks,
  exercises,
  onOpenExercise,
  onRemoveExercise,
  onRenameBlock,
  onDeleteBlock,
  onAddBlock,
  onAddExerciseToBlock,
}: BlockListProps) {
  // Session-level drop target so a whole block can be dragged to the end of
  // the list (below the last block) even though there's no row to hover.
  const { setNodeRef } = useDroppable({ id: sessionDropId(sessionId) });
  return (
    <div
      ref={setNodeRef}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
      <SortableContext
        items={blocks.map((b) => `block:${b.id}`)}
        strategy={verticalListSortingStrategy}>
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            exercises={exercises}
            onOpenExercise={onOpenExercise}
            onRemoveExercise={onRemoveExercise}
            onRename={(name) => onRenameBlock(block.id, name)}
            onDelete={() => onDeleteBlock(block.id)}
            onAddExercise={(exerciseId) =>
              onAddExerciseToBlock(block.id, exerciseId)
            }
          />
        ))}
      </SortableContext>
      <AddBlockForm sessionId={sessionId} onAdd={onAddBlock} />
    </div>
  );
}
