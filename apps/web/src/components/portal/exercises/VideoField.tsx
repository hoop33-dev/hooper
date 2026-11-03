"use client";

import { cn } from "@/src/lib/cn";
import { getEmbedUrl, isYoutubeUrl } from "@/src/lib/videoEmbed";
import type { ExerciseVideoSource } from "@hooper/db";
import { useState } from "react";
import { PortalInput } from "../ui/PortalInput";
import { VideoUploadZone } from "./VideoUploadZone";
import { getVideoSwitchWarning, type VideoFieldState } from "./videoDecision";

interface VideoFieldProps {
  existingUrl?: string | null;
  existingSource?: ExerciseVideoSource | null;
  onChange: (value: VideoFieldState) => void;
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: ExerciseVideoSource;
  onChange: (mode: ExerciseVideoSource) => void;
}) {
  return (
    <div className="bg-portal-bg flex gap-1 rounded-lg p-1">
      {(["upload", "link"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs font-semibold transition",
            mode === tab
              ? "bg-portal-card text-portal-text1 shadow-sm"
              : "text-portal-text3 hover:text-portal-text2",
          )}>
          {tab === "upload" ? "Upload file" : "Video link"}
        </button>
      ))}
    </div>
  );
}

function SwitchWarning({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {message}
    </div>
  );
}

function LinkPanel({
  linkUrl,
  onChange,
}: {
  linkUrl: string;
  onChange: (url: string) => void;
}) {
  const trimmed = linkUrl.trim();
  const isYoutube = isYoutubeUrl(trimmed);
  const embedUrl = isYoutube ? getEmbedUrl(trimmed) : null;
  const showError = trimmed.length > 0 && !isYoutube;

  return (
    <div className="flex flex-col gap-2">
      <PortalInput
        id="exercise-video-link"
        value={linkUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://youtube.com/watch?v=…"
        error={showError ? "Enter a YouTube link" : undefined}
      />
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="border-portal-border aspect-video w-full rounded-xl border"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <p className="text-portal-text3 text-xs">
          Paste a YouTube link (youtube.com or youtu.be).
        </p>
      )}
    </div>
  );
}

export function VideoField({
  existingUrl,
  existingSource,
  onChange,
}: VideoFieldProps) {
  const [mode, setMode] = useState<ExerciseVideoSource>(
    existingSource === "link" ? "link" : "upload",
  );
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState(
    existingSource === "link" ? (existingUrl ?? "") : "",
  );
  const [removed, setRemoved] = useState(false);

  function selectMode(nextMode: ExerciseVideoSource) {
    setMode(nextMode);
    setRemoved(false);
    onChange({ mode: nextMode, file, linkUrl, removed: false });
  }

  function selectFile(nextFile: File) {
    setFile(nextFile);
    setRemoved(false);
    onChange({ mode, file: nextFile, linkUrl, removed: false });
  }

  function changeLink(nextUrl: string) {
    setLinkUrl(nextUrl);
    setRemoved(false);
    onChange({ mode, file, linkUrl: nextUrl, removed: false });
  }

  function removeVideo() {
    setFile(null);
    setLinkUrl("");
    setRemoved(true);
    onChange({ mode, file: null, linkUrl: "", removed: true });
  }

  // Once removed, treat the exercise as if it had no video at all — this is
  // what makes "Remove" reflect immediately (hides the preview, the Remove
  // button itself, and the switch warning) instead of only taking effect
  // once the modal is saved.
  const effectiveExistingUrl = removed ? null : existingUrl;
  const effectiveExistingSource = removed ? null : (existingSource ?? null);

  const hasCurrentVideo =
    mode === "upload"
      ? !!file ||
        (effectiveExistingSource === "upload" && !!effectiveExistingUrl)
      : !!linkUrl;
  const warning = getVideoSwitchWarning(
    mode,
    effectiveExistingSource,
    effectiveExistingUrl,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-portal-text2 text-xs font-semibold">Demo video</p>
        {hasCurrentVideo && (
          <button
            type="button"
            onClick={removeVideo}
            className="text-xs font-semibold text-red-500 hover:underline">
            Remove
          </button>
        )}
      </div>
      <ModeTabs mode={mode} onChange={selectMode} />
      {warning && <SwitchWarning message={warning} />}
      {/* Kept mounted (not swapped) while inactive so VideoUploadZone doesn't
          lose its object-URL preview of a just-picked file when switching tabs. */}
      <div className={cn(mode !== "upload" && "hidden")}>
        <VideoUploadZone
          currentUrl={
            effectiveExistingSource === "upload" ? effectiveExistingUrl : null
          }
          onFileSelect={selectFile}
        />
      </div>
      {mode === "link" && <LinkPanel linkUrl={linkUrl} onChange={changeLink} />}
    </div>
  );
}
