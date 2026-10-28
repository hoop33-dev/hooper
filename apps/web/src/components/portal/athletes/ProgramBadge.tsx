import { cn } from "@/src/lib/cn";
import type { AssignedProgramRef } from "@hooper/db";
import { PortalBadge } from "../ui/PortalBadge";

/** The first program's name, ellipsised when the badge runs out of room,
 * with the "+N" count always visible; hover shows every program. Pass a max
 * width via `className` where the badge shares a row with something that
 * matters more (e.g. an athlete's name). */
export function ProgramBadge({
  programs,
  className,
}: {
  programs: AssignedProgramRef[];
  className?: string;
}) {
  if (programs.length === 0) {
    return <span className="text-portal-text3 text-xs">—</span>;
  }
  return (
    <PortalBadge
      variant="orange"
      className={cn("min-w-0 gap-1", className)}
      title={programs.map((p) => p.name).join(", ")}>
      <span className="truncate">{programs[0].name}</span>
      {programs.length > 1 && (
        <span className="flex-shrink-0">+{programs.length - 1}</span>
      )}
    </PortalBadge>
  );
}
