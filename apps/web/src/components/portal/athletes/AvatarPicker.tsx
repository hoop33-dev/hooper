"use client";

import { useRef } from "react";
import { SpinnerIcon } from "../ui/icons";

interface AvatarPickerProps {
  previewUrl: string | null;
  fallbackLabel: string;
  onFileSelected: (file: File) => void;
  uploading?: boolean;
}

/** Dumb circular preview + file picker — the caller decides what to do with
 * the selected file (stage it for create-then-upload, or upload it
 * immediately for an existing entity), since that sequencing differs
 * between TeamCreateModal (no id yet) and TeamDetailShell (id exists). */
export function AvatarPicker({
  previewUrl,
  fallbackLabel,
  onFileSelected,
  uploading = false,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <div className="bg-portal-orange-soft text-portal-orange relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-extrabold">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          fallbackLabel.trim().charAt(0).toUpperCase() || "T"
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <SpinnerIcon size={18} />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="border-portal-border text-portal-text2 hover:bg-portal-border/50 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
          {previewUrl ? "Change photo" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
