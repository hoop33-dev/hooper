import { cn } from "@/src/lib/cn";
import { getThumbnailUrl } from "@/src/lib/videoEmbed";
import type { ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { PortalBadge } from "../ui/PortalBadge";

interface ExerciseCardProps {
  exercise: ExerciseWithDetails;
  onEdit: (exercise: ExerciseWithDetails) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** True for a variant row nested under its base. */
  indent?: boolean;
}

function ExerciseInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="bg-portal-orange-soft flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg">
      <span className="text-portal-orange text-xs font-extrabold">
        {initials}
      </span>
    </div>
  );
}

/** Cropped video thumbnail (image for YouTube, first frame otherwise), falling back to initials. */
function ExerciseThumbnail({ exercise }: { exercise: ExerciseWithDetails }) {
  const { video_url, video_source, name } = exercise;
  const [failed, setFailed] = useState(false);

  if (!video_url || failed) return <ExerciseInitials name={name} />;

  const imageUrl = video_source === "link" ? getThumbnailUrl(video_url) : null;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <video
      src={video_url}
      muted
      playsInline
      preload="metadata"
      className="h-9 w-9 flex-shrink-0 rounded-lg bg-black object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function ExpandChevron({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="text-portal-text3 hover:text-portal-text2 flex h-5 w-5 flex-shrink-0 items-center justify-center">
      <svg
        className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
        viewBox="0 0 20 20"
        fill="currentColor">
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function ExerciseCard({
  exercise,
  onEdit,
  expanded,
  onToggleExpand,
  indent,
}: ExerciseCardProps) {
  const visibleCategories = exercise.categories.slice(0, 3);
  const overflow = exercise.categories.length - 3;

  function openEdit() {
    onEdit(exercise);
  }

  return (
    <tr
      onClick={openEdit}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openEdit();
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "border-portal-border hover:bg-portal-bg cursor-pointer border-b",
        indent && "bg-portal-bg/60",
      )}>
      <td className="py-3 pr-4">
        <div
          className={cn(
            "flex items-center gap-3",
            indent && "border-portal-border relative ml-10 border-l pl-3",
          )}>
          {onToggleExpand ? (
            <ExpandChevron expanded={!!expanded} onToggle={onToggleExpand} />
          ) : (
            !indent && <span className="w-5 flex-shrink-0" />
          )}
          <ExerciseThumbnail exercise={exercise} />
          <span className="text-portal-text1 text-sm font-semibold">
            {exercise.name}
          </span>
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {visibleCategories.map((cat) => (
            <PortalBadge key={cat.id} variant="neutral">
              {cat.name}
            </PortalBadge>
          ))}
          {overflow > 0 && (
            <PortalBadge variant="neutral">+{overflow}</PortalBadge>
          )}
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {exercise.unitTypes.map((u) => (
            <PortalBadge key={u} variant="orange">
              {u}
            </PortalBadge>
          ))}
        </div>
      </td>
      <td className="text-portal-text3 py-3 text-xs">
        {new Date(exercise.created_at).toLocaleDateString()}
      </td>
    </tr>
  );
}
