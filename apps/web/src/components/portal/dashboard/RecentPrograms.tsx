import type { ProgramSummary } from "@hooper/db";
import Link from "next/link";
import { ProgramStatusBadge } from "../programs/ProgramStatusBadge";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function RecentProgramRow({ program }: { program: ProgramSummary }) {
  const initial = program.name.trim().charAt(0).toUpperCase() || "P";
  return (
    <Link
      href={`/programs/${program.id}`}
      className="hover:bg-portal-bg flex items-center gap-3 px-5 py-3.5 transition-colors">
      <div className="bg-portal-orange-soft text-portal-orange flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-portal-text1 truncate text-[13px] font-bold">
          {program.name}
        </div>
        <div className="text-portal-text3 mt-0.5 text-xs">
          Edited {formatUpdatedAt(program.updated_at)}
        </div>
      </div>
      <ProgramStatusBadge status={program.status} />
    </Link>
  );
}

export function RecentPrograms({ programs }: { programs: ProgramSummary[] }) {
  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <p className="text-portal-text1 text-sm font-semibold">
          No programs yet
        </p>
        <p className="text-portal-text3 text-xs">
          Create your first training program to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-portal-border flex flex-col divide-y">
      {programs.map((program) => (
        <RecentProgramRow key={program.id} program={program} />
      ))}
    </div>
  );
}
