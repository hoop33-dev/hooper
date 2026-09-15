import type { ProgramStatus } from "@hooper/db";
import { PortalBadge } from "../ui/PortalBadge";

export function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  return (
    <PortalBadge variant={status === "active" ? "green" : "neutral"}>
      {status === "active" ? "Active" : "Draft"}
    </PortalBadge>
  );
}
