"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { BlockExerciseWithDetails, BlockWithExercises } from "@hooper/db";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { BlockCard } from "./BlockCard";

interface BlockListProps {
  blocks: BlockWithExercises[];
  onOpenExercise: (be: BlockExerciseWithDetails) => void;
  onRemoveExercise: (exerciseRowId: string) => void;
  onRenameBlock: (blockId: string, name: string) => void;
  onColorChangeBlock: (blockId: string, color: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: (name: string) => Promise<void>;
}

function AddBlockForm({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
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
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="border-portal-border-mid text-portal-text3 rounded-xl border border-dashed py-3 text-center text-sm font-semibold">
        + Add block
      </button>
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
  blocks,
  onOpenExercise,
  onRemoveExercise,
  onRenameBlock,
  onColorChangeBlock,
  onDeleteBlock,
  onAddBlock,
}: BlockListProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
      <SortableContext
        items={blocks.map((b) => `block:${b.id}`)}
        strategy={verticalListSortingStrategy}>
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            sortableBlock
            onOpenExercise={onOpenExercise}
            onRemoveExercise={onRemoveExercise}
            onRename={(name) => onRenameBlock(block.id, name)}
            onColorChange={(color) => onColorChangeBlock(block.id, color)}
            onDelete={() => onDeleteBlock(block.id)}
          />
        ))}
      </SortableContext>
      <AddBlockForm onAdd={onAddBlock} />
    </div>
  );
}
