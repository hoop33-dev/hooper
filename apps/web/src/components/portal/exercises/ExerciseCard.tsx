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
    <div className="bg-portal-orange-soft flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg">
      <span className="text-portal-orange text-xs font-extrabold">
        {initials}
      </span>
    </div>
  );
}

export function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
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
      className="border-portal-border hover:bg-portal-bg cursor-pointer border-b">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <ExerciseInitials name={exercise.name} />
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
