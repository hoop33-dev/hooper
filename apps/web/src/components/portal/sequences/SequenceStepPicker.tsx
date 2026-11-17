"use client";

import { cn } from "@/src/lib/cn";
import type { ExerciseCategoryRow, ExerciseWithDetails } from "@hooper/db";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { CheckIcon, InheritIcon } from "../ui/icons";
import { matchesSearch } from "../ui/ListToolbar";

/** The exercises and categories a sequence editor picks from. */
export type SequenceExerciseLibrary = {
  exercises: ExerciseWithDetails[];
  categories: ExerciseCategoryRow[];
};

const WIDTH = 288;
const HEIGHT = 360;

/** Whether `exercise` is in `categoryId` or one of its child categories. */
export function inCategory(
  exercise: ExerciseWithDetails,
  categoryId: string,
  categories: ExerciseCategoryRow[],
): boolean {
  return exercise.categories.some(
    (c) =>
      c.id === categoryId ||
      categories.find((k) => k.id === c.id)?.parent_id === categoryId,
  );
}

function usePopoverPosition(anchorRef: RefObject<HTMLElement | null>) {
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });
  useLayoutEffect(() => {
    function update() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = rect.bottom + 4;
      const top =
        below + HEIGHT > window.innerHeight - 8
          ? Math.max(8, rect.top - HEIGHT - 4)
          : below;
      const left = Math.min(rect.left, window.innerWidth - WIDTH - 8);
      setStyle({ position: "fixed", top, left, width: WIDTH, height: HEIGHT });
    }
    update();
    // Follows the cell when anything scrolls, like the portal's dropdowns.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);
  return style;
}

/** Closes the picker on an outside click or Escape. */
function usePickerDismiss(
  panelRef: RefObject<HTMLElement | null>,
  anchorRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [panelRef, anchorRef, onClose]);
}

function CategoryToggle({
  categoryName,
  all,
  onChange,
}: {
  categoryName: string;
  all: boolean;
  onChange: (all: boolean) => void;
}) {
  return (
    <div className="flex gap-1">
      {(
        [
          [false, categoryName],
          [true, "All categories"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            all === value
              ? "border-portal-text1 bg-portal-text1 text-white"
              : "border-portal-border bg-portal-card text-portal-text2",
          )}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ExerciseOption({
  exercise,
  selected,
  showCategory,
  onSelect,
}: {
  exercise: ExerciseWithDetails;
  selected: boolean;
  showCategory: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]",
        selected
          ? "bg-portal-orange-soft text-portal-text1 font-bold"
          : "text-portal-text1 hover:bg-portal-bg",
      )}>
      <span className="min-w-0 flex-1 truncate">{exercise.name}</span>
      {showCategory && exercise.categories[0] && (
        <span className="text-portal-text3 shrink-0 text-[10px]">
          {exercise.categories[0].name}
        </span>
      )}
      {selected && (
        <span className="text-portal-orange">
          <CheckIcon />
        </span>
      )}
    </button>
  );
}

export function SequenceStepPicker({
  anchorRef,
  stepLabel,
  categoryId,
  setIndex,
  currentExerciseId,
  inheritedFrom,
  library,
  onPick,
  onReset,
  onClose,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  stepLabel: string;
  categoryId: string | null;
  setIndex: number;
  currentExerciseId: string | null;
  /** Set number this cell would carry forward from if reset; null when it
   * can't be reset (set 1, or already carried forward). */
  inheritedFrom: number | null;
  library: SequenceExerciseLibrary;
  onPick: (exerciseId: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const style = usePopoverPosition(anchorRef);
  const [query, setQuery] = useState("");
  const [allCategories, setAllCategories] = useState(!categoryId);
  const category = library.categories.find((c) => c.id === categoryId);
  usePickerDismiss(panelRef, anchorRef, onClose);

  const list = useMemo(
    () =>
      library.exercises.filter(
        (e) =>
          (allCategories ||
            !categoryId ||
            inCategory(e, categoryId, library.categories)) &&
          matchesSearch(query, e.name),
      ),
    [library, allCategories, categoryId, query],
  );

  return createPortal(
    // Portalled, but React still bubbles its clicks to the cell that opened
    // it, which would toggle the picker straight back open.
    <div
      ref={panelRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
      className="border-portal-border-mid bg-portal-card z-[70] flex flex-col overflow-hidden rounded-xl border shadow-xl">
      <div className="border-portal-border flex flex-col gap-2 border-b px-3 py-2.5">
        <div className="text-portal-text3 text-[11px]">
          <b className="text-portal-text1 font-bold">{stepLabel || "Step"}</b>,
          Set {setIndex + 1}
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="border-portal-border bg-portal-bg text-portal-text1 placeholder:text-portal-text3 focus:border-portal-orange h-8 rounded-lg border px-2.5 text-[13px] focus:outline-none"
        />
        {category && (
          <CategoryToggle
            categoryName={category.name}
            all={allCategories}
            onChange={setAllCategories}
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {inheritedFrom !== null && (
          <button
            type="button"
            onClick={() => {
              onReset();
              onClose();
            }}
            className="border-portal-border flex w-full items-center gap-1.5 border-b px-3 py-2 text-left text-xs font-semibold text-blue-700 hover:bg-blue-50">
            <InheritIcon /> Same as set {inheritedFrom + 1}
          </button>
        )}
        {list.map((exercise) => (
          <ExerciseOption
            key={exercise.id}
            exercise={exercise}
            selected={exercise.id === currentExerciseId}
            showCategory={allCategories}
            onSelect={() => {
              onPick(exercise.id);
              onClose();
            }}
          />
        ))}
        {list.length === 0 && (
          <div className="text-portal-text3 p-4 text-xs">No matches.</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
