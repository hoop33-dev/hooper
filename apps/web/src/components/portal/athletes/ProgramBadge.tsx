import type { AssignedProgramRef } from "@hooper/db";
import { PortalBadge } from "../ui/PortalBadge";

export function formatProgramBadge(programs: AssignedProgramRef[]): string {
  if (programs.length === 0) return "—";
  if (programs.length === 1) return programs[0].name;
  return `${programs[0].name} +${programs.length - 1}`;
}

export function ProgramBadge({ programs }: { programs: AssignedProgramRef[] }) {
  if (programs.length === 0) {
    return <span className="text-portal-text3 text-xs">—</span>;
  }
  return (
    <PortalBadge variant="orange">{formatProgramBadge(programs)}</PortalBadge>
  );
}
