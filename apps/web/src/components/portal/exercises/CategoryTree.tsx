"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ExerciseCategoryTreeNode } from "@hooper/db";
import { flattenTree } from "@/src/lib/categoryTree";
import { cn } from "@/src/lib/cn";

type FlatItem = ExerciseCategoryTreeNode & { depth: number };
export type DropPosition = "before" | "inside" | "after";
type DropTarget = { id: string; position: DropPosition } | null;

interface CategoryTreeProps {
  nodes: ExerciseCategoryTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDrop: (dragId: string, targetId: string, position: DropPosition) => void;
}

function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
      <circle cx="2" cy="2" r="1.2"/><circle cx="2" cy="6" r="1.2"/><circle cx="2" cy="10" r="1.2"/>
      <circle cx="6" cy="2" r="1.2"/><circle cx="6" cy="6" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
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

function DropLine() {
  return <div className="mx-2 my-0.5 h-0.5 rounded-full bg-portal-orange" />;
}

function rowClass(isDropTarget: boolean, dropPos: DropPosition | undefined, isSelected: boolean, activeId: string | null) {
  if (isDropTarget && dropPos === "inside") return "outline outline-2 -outline-offset-2 outline-portal-orange";
  if (isSelected) return "bg-portal-orange-soft";
  if (!activeId) return "hover:bg-portal-border/50";
  return "";
}

function DraggableItem({
  item, selectedId, onSelect, activeId, dropTarget, collapsed, onToggleCollapse,
}: {
  item: FlatItem;
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeId: string | null;
  dropTarget: DropTarget;
  collapsed: Set<string>;
  onToggleCollapse: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: item.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: item.id });
  const setRef = (el: HTMLElement | null) => { setDragRef(el); setDropRef(el); };
  const isSelected = selectedId === item.id;
  const isDropTarget = dropTarget?.id === item.id;
  const isChildOfActive = activeId !== null && item.parent_id === activeId;
  const opacity = isDragging || isChildOfActive ? 0.3 : 1;
  const dropPos = dropTarget?.position;

  return (
    <>
      {isDropTarget && dropPos === "before" && <DropLine />}
      <div
        ref={setRef}
        style={{ marginLeft: item.depth > 0 ? "20px" : 0, opacity }}
        className={cn("group flex items-center gap-0.5 rounded-lg transition-colors", rowClass(isDropTarget, dropPos, isSelected, activeId))}
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
          onClick={() => onSelect(item.id)}
          className="flex flex-1 items-center gap-1.5 rounded-lg px-2 py-2"
        >
          {item.children.length > 0 ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleCollapse(item.id); }}
            >
              <ChevronIcon expanded={!collapsed.has(item.id)} />
            </button>
          ) : (
            <span className="w-3" />
          )}
          <span className={cn(
            "flex-1 text-left text-[13px]",
            isSelected ? "font-bold text-portal-orange" : "font-semibold text-portal-text1",
          )}>
            {item.name}
          </span>
          <span className="text-[11px] text-portal-text3">{item.exercise_count}</span>
        </button>
      </div>
      {isDropTarget && dropPos === "after" && <DropLine />}
    </>
  );
}

export function CategoryTree({ nodes, selectedId, onSelect, onDrop }: CategoryTreeProps) {
  const [flatItems, setFlatItems] = useState(() => flattenTree(nodes));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { setFlatItems(flattenTree(nodes)); }, [nodes]);

  const visibleItems = useMemo(
    () => flatItems.filter((item) => !item.parent_id || !collapsed.has(item.parent_id)),
    [flatItems, collapsed],
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ active, over, delta }: DragOverEvent) {
    if (!over || over.id === active.id) { setDropTarget(null); return; }
    const overRect = over.rect;
    const initialRect = active.rect.current.initial;
    if (!initialRect) { setDropTarget(null); return; }
    const activeCenterY = initialRect.top + initialRect.height / 2 + delta.y;
    const ratio = (activeCenterY - overRect.top) / overRect.height;
    const overId = over.id as string;
    const overItem = flatItems.find((f) => f.id === overId);
    const dragItem = flatItems.find((f) => f.id === (active.id as string));
    const canNest = overItem?.depth === 0 && !dragItem?.children.length && overId !== active.id;
    const position: DropPosition =
      canNest && ratio > 0.3 && ratio < 0.7 ? "inside" : ratio < 0.5 ? "before" : "after";
    setDropTarget({ id: overId, position });
  }

  function handleDragEnd({ active }: DragEndEvent) {
    if (dropTarget && dropTarget.id !== active.id) {
      onDrop(active.id as string, dropTarget.id, dropTarget.position);
    }
    setActiveId(null);
    setDropTarget(null);
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const activeItem = flatItems.find((f) => f.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-0.5">
        {visibleItems.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            selectedId={selectedId}
            onSelect={onSelect}
            activeId={activeId}
            dropTarget={dropTarget}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem && (
          <div className="flex cursor-grabbing items-center gap-2 rounded-lg border border-portal-border bg-portal-card px-3 py-2 opacity-90 shadow-ambient">
            <GripIcon />
            <span className="text-[13px] font-semibold text-portal-text1">{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
