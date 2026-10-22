"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ExerciseCategoryTreeNode } from "@hooper/db";
import { flattenTree } from "@/src/lib/categoryTree";
import { cn } from "@/src/lib/cn";

type FlatItem = ExerciseCategoryTreeNode & { depth: number };
export type DropPosition = "before" | "inside" | "after";
type DropTarget = { id: string; position: DropPosition } | null;

const ROOT_END_ID = "__end__";

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

function isDescendantOf(flatItems: FlatItem[], nodeId: string, ancestorId: string): boolean {
  const node = flatItems.find((f) => f.id === nodeId);
  if (!node?.parent_id) return false;
  if (node.parent_id === ancestorId) return true;
  return isDescendantOf(flatItems, node.parent_id, ancestorId);
}

function isItemHidden(item: FlatItem, flatItems: FlatItem[], collapsed: Set<string>): boolean {
  if (!item.parent_id) return false;
  if (collapsed.has(item.parent_id)) return true;
  const parent = flatItems.find((f) => f.id === item.parent_id);
  return parent ? isItemHidden(parent, flatItems, collapsed) : false;
}

function buildDescendantSet(flatItems: FlatItem[], rootId: string): Set<string> {
  const set = new Set<string>();
  const add = (id: string) => flatItems.filter((f) => f.parent_id === id).forEach((f) => { set.add(f.id); add(f.id); });
  add(rootId);
  return set;
}

function resolveEndDrop(flatItems: FlatItem[], dragId: string): { id: string; position: DropPosition } | null {
  const last = flatItems.filter((f) => !f.parent_id && f.id !== dragId).at(-1);
  return last ? { id: last.id, position: "after" } : null;
}

function positionFor(
  pointerY: number,
  overRect: { top: number; height: number },
  flatItems: FlatItem[],
  overId: string,
  activeId: string,
): DropPosition {
  const ratio = (pointerY - overRect.top) / overRect.height;
  const wouldCycle = isDescendantOf(flatItems, overId, activeId);
  return !wouldCycle && ratio > 0.15 && ratio < 0.85 ? "inside" : ratio < 0.5 ? "before" : "after";
}

function RootDropZone({ isActive, dropTarget }: { isActive: boolean; dropTarget: DropTarget }) {
  const { setNodeRef } = useDroppable({ id: ROOT_END_ID });
  if (!isActive) return null;
  return (
    <div ref={setNodeRef} className="min-h-[32px]">
      {dropTarget?.id === ROOT_END_ID && <DropLine />}
    </div>
  );
}

function DraggableItem({
  item, selectedId, onSelect, activeId, dropTarget, collapsed, onToggleCollapse, descendantsOfActive,
}: {
  item: FlatItem;
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeId: string | null;
  dropTarget: DropTarget;
  collapsed: Set<string>;
  onToggleCollapse: (id: string) => void;
  descendantsOfActive: Set<string>;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: item.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: item.id });
  const setRef = (el: HTMLElement | null) => { setDragRef(el); setDropRef(el); };
  const isSelected = selectedId === item.id;
  const isDropTarget = dropTarget?.id === item.id;
  const opacity = isDragging || descendantsOfActive.has(item.id) ? 0.3 : 1;
  const dropPos = dropTarget?.position;

  return (
    <>
      {isDropTarget && dropPos === "before" && <DropLine />}
      <div
        ref={setRef}
        style={{ marginLeft: item.depth * 20, opacity }}
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
  const pointerYRef = useRef(0);
  const dropTargetRef = useRef<DropTarget>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { setFlatItems(flattenTree(nodes)); }, [nodes]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { pointerYRef.current = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const visibleItems = useMemo(() => flatItems.filter((item) => !isItemHidden(item, flatItems, collapsed)), [flatItems, collapsed]);
  const descendantsOfActive = useMemo(() => activeId ? buildDescendantSet(flatItems, activeId) : new Set<string>(), [flatItems, activeId]);

  function setDt(dt: DropTarget) {
    if (dropTargetRef.current?.id === dt?.id && dropTargetRef.current?.position === dt?.position) return;
    dropTargetRef.current = dt;
    setDropTarget(dt);
  }

  function handleDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); }

  function handleDragMove({ active, over }: DragMoveEvent) {
    if (!over || over.id === active.id) { setDt(null); return; }
    const overId = over.id as string;
    if (overId === ROOT_END_ID) { setDt({ id: ROOT_END_ID, position: "after" }); return; }
    setDt({ id: overId, position: positionFor(pointerYRef.current, over.rect, flatItems, overId, active.id as string) });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && over.id !== active.id) {
      const overId = over.id as string;
      const resolved = overId === ROOT_END_ID
        ? resolveEndDrop(flatItems, active.id as string)
        : { id: overId, position: positionFor(pointerYRef.current, over.rect, flatItems, overId, active.id as string) };
      if (resolved) onDrop(active.id as string, resolved.id, resolved.position);
    }
    dropTargetRef.current = null;
    setActiveId(null);
    setDropTarget(null);
  }

  function toggleCollapse(id: string) {
    setCollapsed((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  const activeItem = flatItems.find((f) => f.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
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
            descendantsOfActive={descendantsOfActive}
          />
        ))}
        <RootDropZone isActive={!!activeId} dropTarget={dropTarget} />
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
