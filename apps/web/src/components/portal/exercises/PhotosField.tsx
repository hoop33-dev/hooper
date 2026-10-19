"use client";

import { cn } from "@/src/lib/cn";
import {
  EXERCISE_PHOTOS_MAX,
  EXERCISE_PHOTO_CAPTION_MAX,
} from "@/src/lib/exercisePhotos";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import { ImageIcon, XIcon } from "../ui/icons";
import type { PhotoDraft, PhotoRowErrors } from "./photoFieldState";

const ACCEPT = "image/jpeg,image/png,image/webp";

function isAcceptedImage(file: File): boolean {
  return ACCEPT.split(",").includes(file.type);
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

function PhotoThumb({
  index,
  previewUrl,
  invalid,
  onPick,
}: {
  index: number;
  previewUrl: string | null;
  invalid: boolean;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isAcceptedImage(file)) onPick(file);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      title={previewUrl ? "Replace photo" : "Choose photo"}
      aria-label={previewUrl ? `Replace photo ${index + 1}` : "Choose photo"}
      className={cn(
        "group relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg",
        previewUrl
          ? "bg-portal-bg"
          : "bg-portal-bg text-portal-text3 hover:text-portal-orange flex items-center justify-center border-[1.5px] border-dashed",
        !previewUrl &&
          (invalid
            ? "border-red-400 text-red-400"
            : dragging
              ? "border-portal-orange text-portal-orange"
              : "border-portal-border"),
      )}>
      {previewUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-[10px] font-semibold text-white group-hover:flex">
            Replace
          </span>
        </>
      ) : (
        <ImageIcon size={16} />
      )}
      <span className="bg-portal-orange font-title pointer-events-none absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded text-[10.5px] font-black text-white">
        {index + 1}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function SortablePhotoRow({
  draft,
  index,
  errors,
  autoFocusCaption,
  onPick,
  onCaptionChange,
  onRemove,
}: {
  draft: PhotoDraft;
  index: number;
  errors?: PhotoRowErrors;
  autoFocusCaption?: boolean;
  onPick: (file: File) => void;
  onCaptionChange: (caption: string) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: draft.key });
  const invalid = !!errors;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-photo-invalid={invalid || undefined}
      className={cn("flex flex-col gap-1", isDragging && "relative z-10")}>
      <div
        className={cn(
          "bg-portal-card flex items-center gap-2 rounded-xl border-[1.3px] p-2",
          isDragging
            ? "border-portal-orange bg-portal-orange-soft shadow-lg"
            : invalid
              ? "border-red-400"
              : "border-portal-border",
        )}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          aria-label={`Reorder photo ${index + 1}`}
          className="text-portal-text3 flex h-10 w-4 flex-shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing">
          <GripIcon />
        </button>
        <PhotoThumb
          index={index}
          previewUrl={draft.previewUrl}
          invalid={!!errors?.image}
          onPick={onPick}
        />
        <input
          value={draft.caption}
          autoFocus={autoFocusCaption}
          maxLength={EXERCISE_PHOTO_CAPTION_MAX}
          placeholder="Caption, e.g. Spot 1 · Left corner"
          aria-label={`Photo ${index + 1} caption`}
          aria-invalid={!!errors?.caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          className={cn(
            "text-portal-text1 placeholder:text-portal-text3 h-9 min-w-0 flex-1 rounded-lg border-[1.3px] bg-white px-2.5 text-[13px] outline-none",
            errors?.caption
              ? "border-red-400"
              : "border-portal-border focus:border-portal-orange",
          )}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove photo ${index + 1}`}
          className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg">
          <XIcon size={13} />
        </button>
      </div>
      {invalid && (
        <p className="px-1 text-xs text-red-500">
          {[errors.image, errors.caption].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

function PhotosHeader({ count }: { count: number }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-portal-text2 text-xs font-semibold">
          Photos{" "}
          <span className="text-portal-text3 font-normal">
            (up to {EXERCISE_PHOTOS_MAX})
          </span>
        </p>
        <span
          className={cn(
            "text-xs font-bold",
            count >= EXERCISE_PHOTOS_MAX
              ? "text-portal-orange"
              : "text-portal-text3",
          )}>
          {count}/{EXERCISE_PHOTOS_MAX}
        </span>
      </div>
      <p className="text-portal-text3 text-xs leading-snug">
        Shooting spots, muscle groups, setup positions. Athletes swipe through
        them after the video, in this order.
      </p>
    </>
  );
}

/** Drop/browse target below the list — each picked image becomes a new row
 * (several at once, up to the remaining slots) with its caption focused. */
function PhotoDropZone({
  remaining,
  onFiles,
}: {
  remaining: number;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (remaining <= 0)
    return (
      <p className="text-portal-text3 py-1 text-center text-xs">
        Photo limit reached. Remove one to add another.
      </p>
    );

  function accept(list: FileList | null) {
    const files = [...(list ?? [])].filter(isAcceptedImage);
    if (files.length) onFiles(files.slice(0, remaining));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        inputRef.current?.click();
      }}
      onDragEnter={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white px-4 py-6 transition",
        dragging
          ? "border-portal-orange bg-portal-orange-soft"
          : "border-portal-border hover:border-portal-orange/50 hover:bg-portal-bg",
      )}>
      <span className="text-portal-text3">
        <ImageIcon size={28} />
      </span>
      <div className="text-center">
        <p className="text-portal-text2 text-sm font-semibold">
          Drop photo here or <span className="text-portal-orange">browse</span>
        </p>
        <p className="text-portal-text3 mt-1 text-xs">
          JPG, PNG, WebP — {remaining} more
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

interface PhotosFieldProps {
  photos: PhotoDraft[];
  onChange: (photos: PhotoDraft[]) => void;
  /** Per-row errors keyed by draft.key — only passed once a save has been
   * attempted, so a just-added row isn't flagged before its caption is typed. */
  errors?: Record<string, PhotoRowErrors>;
}

export function PhotosField({ photos, onChange, errors }: PhotosFieldProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Object URLs for picked files are owned here — revoke the ones that are
  // no longer shown, and all of them on unmount.
  const objectUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  function release(draft: PhotoDraft) {
    if (draft.file && draft.previewUrl) {
      URL.revokeObjectURL(draft.previewUrl);
      objectUrls.current.delete(draft.previewUrl);
    }
  }

  function update(key: string, patch: Partial<PhotoDraft>) {
    onChange(photos.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function pick(draft: PhotoDraft, file: File) {
    release(draft);
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.add(previewUrl);
    // A replacement drops the stored path, so the old file is cleaned up
    // on save (see removedPhotoPaths).
    update(draft.key, { file, previewUrl, storagePath: null });
  }

  function remove(draft: PhotoDraft) {
    release(draft);
    onChange(photos.filter((p) => p.key !== draft.key));
  }

  // The first row added by the latest drop/browse — its caption input
  // autofocuses on mount so the coach can type the description straight away.
  const [focusKey, setFocusKey] = useState<string | null>(null);

  function addFiles(files: File[]) {
    const added = files
      .slice(0, EXERCISE_PHOTOS_MAX - photos.length)
      .map((file): PhotoDraft => {
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);
        return {
          key: crypto.randomUUID(),
          storagePath: null,
          file,
          previewUrl,
          caption: "",
        };
      });
    if (!added.length) return;
    setFocusKey(added[0].key);
    onChange([...photos, ...added]);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.key === active.id);
    const to = photos.findIndex((p) => p.key === over.id);
    if (from === -1 || to === -1) return;
    onChange(arrayMove(photos, from, to));
  }

  return (
    <div className="flex flex-col gap-2">
      <PhotosHeader count={photos.length} />

      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={photos.map((p) => p.key)}
            strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {photos.map((draft, i) => (
                <SortablePhotoRow
                  key={draft.key}
                  draft={draft}
                  index={i}
                  errors={errors?.[draft.key]}
                  autoFocusCaption={draft.key === focusKey}
                  onPick={(file) => pick(draft, file)}
                  onCaptionChange={(caption) => update(draft.key, { caption })}
                  onRemove={() => remove(draft)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PhotoDropZone
        remaining={EXERCISE_PHOTOS_MAX - photos.length}
        onFiles={addFiles}
      />
    </div>
  );
}
