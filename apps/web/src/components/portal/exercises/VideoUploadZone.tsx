"use client";

import { useRef, useState } from "react";
import { cn } from "@/src/lib/cn";

interface VideoUploadZoneProps {
  currentUrl?: string | null;
  onFileSelect: (file: File) => void;
}

export function VideoUploadZone({ currentUrl, onFileSelect }: VideoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("video/")) return;
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-portal-text2">Demo video</p>
      {displayUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-portal-border">
          <video
            src={displayUrl}
            className="h-48 w-full object-cover"
            controls
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/80"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition",
            dragging
              ? "border-portal-orange bg-portal-orange-soft"
              : "border-portal-border hover:border-portal-orange/50 hover:bg-portal-bg",
          )}
        >
          <svg className="h-8 w-8 text-portal-text3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-portal-text2">
              Drop video here or{" "}
              <span className="text-portal-orange">browse</span>
            </p>
            <p className="mt-1 text-xs text-portal-text3">MP4, MOV, WebM — max 500 MB</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
