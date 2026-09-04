import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { SessionRow } from "@hooper/db";
import { ChevronLeftIcon, ChevronRightIcon } from "../ui/icons";

interface SessionNavArrowsProps {
  programId: string;
  sessions: SessionRow[];
  currentSessionId: string;
}

/** The session immediately before/after the current one in the program's
 * overall week-then-position order (the same sequence `sessions` — from
 * listSessionsForProgram — is already sorted in). */
function findAdjacentSessions(
  sessions: SessionRow[],
  currentSessionId: string,
) {
  const index = sessions.findIndex((s) => s.id === currentSessionId);
  return {
    prev: index > 0 ? sessions[index - 1] : null,
    next:
      index >= 0 && index < sessions.length - 1 ? sessions[index + 1] : null,
  };
}

function NavLink({
  programId,
  session,
  direction,
}: {
  programId: string;
  session: SessionRow;
  direction: "prev" | "next";
}) {
  return (
    <AppLink
      href={`/programs/${programId}/sessions/${session.id}`}
      title={session.name}
      className="border-portal-border text-portal-text2 hover:bg-portal-bg flex max-w-[150px] items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold">
      {direction === "prev" && <ChevronLeftIcon size={10} />}
      <span className="truncate">{session.name}</span>
      {direction === "next" && <ChevronRightIcon size={10} />}
    </AppLink>
  );
}

function NavPlaceholder({ direction }: { direction: "prev" | "next" }) {
  return (
    <span className="border-portal-border-mid text-portal-text3 flex items-center gap-1 rounded-lg border border-dashed px-2.5 py-1 text-xs font-semibold opacity-50">
      {direction === "prev" && <ChevronLeftIcon size={10} />}
      {direction === "prev" ? "Start" : "End"}
      {direction === "next" && <ChevronRightIcon size={10} />}
    </span>
  );
}

/** Steps to the previous/next session in the program's overall week-then-
 * position order (the same sequence the program canvas renders). */
export function SessionNavArrows({
  programId,
  sessions,
  currentSessionId,
}: SessionNavArrowsProps) {
  const { prev, next } = findAdjacentSessions(sessions, currentSessionId);
  return (
    <div className="flex items-center gap-1.5">
      {prev ? (
        <NavLink programId={programId} session={prev} direction="prev" />
      ) : (
        <NavPlaceholder direction="prev" />
      )}
      {next ? (
        <NavLink programId={programId} session={next} direction="next" />
      ) : (
        <NavPlaceholder direction="next" />
      )}
    </div>
  );
}
