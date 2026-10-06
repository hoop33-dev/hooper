"use client";

import { cn } from "@/src/lib/cn";
import { getThumbnailUrl } from "@/src/lib/videoEmbed";
import type { ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";

type ThumbnailExercise = Pick<
  ExerciseWithDetails,
  "name" | "video_url" | "video_source" | "video_thumbnail_url"
>;

function exerciseInitials(name: string): string {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

interface ExerciseVideoThumbnailProps {
  exercise: ThumbnailExercise;
  /** Sizing/shape for the frame — the thumbnail always `object-cover`s it, so
   * vertical videos are cropped to fill rather than letterboxed. */
  className?: string;
  /** Font size etc. for the initials shown when there's no video. */
  fallbackClassName?: string;
}

/**
 * A cropped still of an exercise's demo video — YouTube's thumbnail for a
 * link, the frame captured at upload time for an upload — falling back to the
 * exercise's initials when there's no video (or the image fails to load).
 */
export function ExerciseVideoThumbnail({
  exercise,
  className,
  fallbackClassName,
}: ExerciseVideoThumbnailProps) {
  const { video_url, video_source, video_thumbnail_url, name } = exercise;
  const [failed, setFailed] = useState(false);

  const imageUrl =
    video_source === "link"
      ? getThumbnailUrl(video_url ?? "")
      : video_thumbnail_url;

  if (video_url && imageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className={cn("bg-black object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  if (video_url && video_source === "upload" && !failed) {
    return (
      <video
        src={video_url}
        muted
        playsInline
        preload="metadata"
        draggable={false}
        className={cn("bg-black object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "bg-portal-orange-soft flex items-center justify-center",
        className,
      )}>
      <span
        className={cn(
          "text-portal-orange font-extrabold",
          fallbackClassName ?? "text-xs",
        )}>
        {exerciseInitials(name)}
      </span>
    </div>
  );
}
