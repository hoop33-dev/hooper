"use client";

import { AppLink } from "@/src/components/portal/ui/AppLink";
import { getEmbedUrl } from "@/src/lib/videoEmbed";
import type { ExerciseWithDetails } from "@hooper/db";
import { useModalDismiss } from "../ui/useModalDismiss";

interface ExercisePreviewModalProps {
  exercise: ExerciseWithDetails;
  onClose: () => void;
}

function PreviewVideo({ exercise }: { exercise: ExerciseWithDetails }) {
  const { video_url, video_source } = exercise;

  if (!video_url) {
    return (
      <div className="border-portal-border bg-portal-bg text-portal-text3 flex aspect-video items-center justify-center rounded-xl border text-xs">
        No video available
      </div>
    );
  }

  // Only "link" videos can be YouTube/Vimeo embeds; other links (and all
  // uploads) are direct file URLs, so they fall back to a native player.
  const embedUrl = video_source === "link" ? getEmbedUrl(video_url) : null;
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="border-portal-border aspect-video w-full rounded-xl border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={video_url}
      controls
      className="border-portal-border aspect-video w-full rounded-xl border bg-black"
    />
  );
}

export function ExercisePreviewModal({
  exercise,
  onClose,
}: ExercisePreviewModalProps) {
  const onBackdropClick = useModalDismiss(onClose);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl">
        <div className="border-portal-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-title text-portal-text1 text-lg font-extrabold tracking-wide">
            {exercise.name}
          </h2>
          <div className="flex flex-shrink-0 items-center gap-1">
            <AppLink
              href={`/exercises/${exercise.id}`}
              title="Edit exercise"
              className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </AppLink>
            <button
              type="button"
              onClick={onClose}
              className="text-portal-text3 hover:bg-portal-bg hover:text-portal-text1 flex h-8 w-8 items-center justify-center rounded-lg">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <PreviewVideo exercise={exercise} />
          {exercise.description && (
            <p className="text-portal-text2 text-sm whitespace-pre-wrap">
              {exercise.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
