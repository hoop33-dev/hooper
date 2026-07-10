"use client";

import { cn } from "@/src/lib/cn";
import {
  exceedsMaxDuration,
  formatDuration,
  readVideoDuration,
} from "@/src/lib/videoDuration";
import { useRef, useState } from "react";

interface VideoUploadZoneProps {
  currentUrl?: string | null;
  onFileSelect: (file: File) => void;
}

function DropZone({
  dragging,
  onDragEnter,
  onDragLeave,
  onDrop,
  onClick,
}: {
  dragging: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        "flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition",
        dragging
          ? "border-portal-orange bg-portal-orange-soft"
          : "border-portal-border hover:border-portal-orange/50 hover:bg-portal-bg",
      )}>
      <svg
        className="text-portal-text3 h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"
        />
      </svg>
      <div className="text-center">
        <p className="text-portal-text2 text-sm font-semibold">
          Drop video here or <span className="text-portal-orange">browse</span>
        </p>
        <p className="text-portal-text3 mt-1 text-xs">
          MP4, MOV, WebM — max 500 MB, 2 min
        </p>
      </div>
    </div>
  );
}

export function VideoUploadZone({
  currentUrl,
  onFileSelect,
}: VideoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) return;
    setError(null);
    try {
      const duration = await readVideoDuration(file);
      if (exceedsMaxDuration(duration)) {
        setError(
          `This video is ${formatDuration(duration)} long — please use one under 2:00.`,
        );
        return;
      }
    } catch {
      // Metadata unreadable (e.g. unsupported codec) — let it through; the
      // bucket's 500 MB size limit still applies server-side.
    }
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-portal-text2 text-xs font-semibold">Demo video</p>
      {displayUrl ? (
        <div className="border-portal-border relative overflow-hidden rounded-xl border">
          <video
            src={displayUrl}
            className="h-48 w-full object-cover"
            controls
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute right-2 bottom-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/80">
            Replace
          </button>
        </div>
      ) : (
        <DropZone
          dragging={dragging}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
