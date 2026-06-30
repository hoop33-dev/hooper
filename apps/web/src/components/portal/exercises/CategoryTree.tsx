"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import type { ExerciseCategoryTreeNode } from "@hooper/db";
import { cn } from "@/src/lib/cn";

function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
      <circle cx="2" cy="2"  r="1.2"/><circle cx="2" cy="6"  r="1.2"/><circle cx="2" cy="10" r="1.2"/>
      <circle cx="6" cy="2"  r="1.2"/><circle cx="6" cy="6"  r="1.2"/><circle cx="6" cy="10" r="1.2"/>
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn("h-3 w-3 transition-transform text-portal-text3", expanded && "rotate-90")}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path d="M4 3l4 3-4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface SortableItemProps {
  node: ExerciseCategoryTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SortableItem({ node, selectedId, onSelect }: SortableItemProps) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedId === node.id;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-lg",
          isSelected ? "bg-portal-orange-soft" : "hover:bg-portal-border/50",
        )}
      >
        <button
          type="button"
          className="flex h-8 w-5 flex-shrink-0 cursor-grab items-center justify-center text-portal-text3 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex flex-1 items-center gap-1.5 rounded-lg px-2 py-2"
        >
          {node.children.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              <ChevronIcon expanded={expanded} />
            </button>
          )}
          {node.children.length === 0 && <span className="w-3" />}
          <span
            className={cn(
              "flex-1 text-left text-[13px]",
              isSelected ? "font-bold text-portal-orange" : "font-semibold text-portal-text1",
            )}
          >
            {node.name}
          </span>
          <span className="text-[11px] text-portal-text3">{node.exercise_count}</span>
        </button>
      </div>

      {expanded && node.children.length > 0 && (
        <div className="ml-5">
          {node.children.map((child) => (
            <SortableItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryTreeProps {
  nodes: ExerciseCategoryTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (updates: { id: string; position: number }[]) => void;
}

export function CategoryTree({ nodes, selectedId, onSelect, onReorder }: CategoryTreeProps) {
  const [items, setItems] = useState(nodes);

  useEffect(() => {
    setItems(nodes);
  }, [nodes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((n) => n.id === active.id);
    const newIndex = items.findIndex((n) => n.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onReorder(reordered.map((n, i) => ({ id: n.id, position: i })));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {items.map((node) => (
            <SortableItem
              key={node.id}
              node={node}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
