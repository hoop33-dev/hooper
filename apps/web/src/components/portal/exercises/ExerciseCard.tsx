import type { ExerciseWithDetails } from "@hooper/db";
import { PortalBadge } from "../ui/PortalBadge";

interface ExerciseCardProps {
  exercise: ExerciseWithDetails;
  onEdit: (exercise: ExerciseWithDetails) => void;
}

function ExerciseInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-portal-orange-soft">
      <span className="text-xs font-extrabold text-portal-orange">{initials}</span>
    </div>
  );
}

export function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
  const visibleCategories = exercise.categories.slice(0, 3);
  const overflow = exercise.categories.length - 3;

  return (
    <tr className="group border-b border-portal-border hover:bg-portal-bg">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <ExerciseInitials name={exercise.name} />
          <span className="text-sm font-semibold text-portal-text1">{exercise.name}</span>
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
      <td className="py-3 text-xs text-portal-text3">
        {new Date(exercise.created_at).toLocaleDateString()}
      </td>
      <td className="py-3 text-right">
        <button
          type="button"
          onClick={() => onEdit(exercise)}
          className="rounded-lg border border-portal-border bg-portal-card px-3 py-1.5 text-xs font-semibold text-portal-text2 opacity-0 transition hover:bg-portal-bg group-hover:opacity-100"
        >
          Edit
        </button>
      </td>
    </tr>
  );
}
