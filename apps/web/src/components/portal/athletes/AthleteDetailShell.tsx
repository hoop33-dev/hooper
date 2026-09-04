"use client";

import type { AthleteDetail } from "@hooper/db";
import { PageHeader } from "../ui/PageHeader";
import { AssignedProgramsTable } from "./AssignedProgramsTable";
import { AssignProgramsModal } from "./AssignProgramsModal";
import { useLazyPrograms } from "./useLazyPrograms";
import { useProgramAssignments } from "./useProgramAssignments";

type ActionResult = { ok: boolean; error?: string };
type ProgramOption = { id: string; name: string };

interface AthleteDetailShellProps {
  athlete: AthleteDetail;
  /** Lazily loaded when the assign modal first opens — see
   * `listAssignableProgramsAction`. */
  loadPrograms: () => Promise<ProgramOption[]>;
  assignProgramAction: (
    profileId: string,
    programId: string,
  ) => Promise<ActionResult>;
  unassignProgramAction: (
    profileId: string,
    programId: string,
  ) => Promise<ActionResult>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-portal-text3 text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-portal-text1 text-sm">{value}</span>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AthleteDetailShell({
  athlete,
  loadPrograms,
  assignProgramAction,
  unassignProgramAction,
}: AthleteDetailShellProps) {
  const assign = useLazyPrograms(loadPrograms);
  const { assignedPrograms, assignProgram, unassignProgram } =
    useProgramAssignments(
      athlete.programs,
      assign.programs,
      (programId) => assignProgramAction(athlete.id, programId),
      (programId) => unassignProgramAction(athlete.id, programId),
    );

  const name =
    [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
    athlete.username ||
    "Unnamed athlete";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        title={name}
        subtitle={athlete.username ? `@${athlete.username}` : undefined}
        backHref="/athletes"
        breadcrumbs={[
          { label: "Athletes", href: "/athletes" },
          { label: name },
        ]}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="flex items-center gap-4">
          <div className="bg-portal-orange-soft text-portal-orange flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-extrabold">
            {athlete.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={athlete.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              name.trim().charAt(0).toUpperCase() || "A"
            )}
          </div>
          <div>
            <div className="text-portal-text1 text-lg font-bold">{name}</div>
            <div className="text-portal-text3 text-xs">
              Last login: {formatDate(athlete.last_sign_in_at)}
            </div>
          </div>
        </div>

        <div className="border-portal-border bg-portal-card mt-6 grid grid-cols-2 gap-5 rounded-xl border p-5 sm:grid-cols-3">
          <InfoRow
            label="Date of birth"
            value={formatDate(athlete.date_of_birth)}
          />
          <InfoRow label="Mobile" value={athlete.mobile ?? "—"} />
          <InfoRow label="Location" value={athlete.regionName ?? "—"} />
        </div>

        {athlete.bio && (
          <div className="border-portal-border bg-portal-card mt-4 rounded-xl border p-5">
            <div className="text-portal-text3 mb-1 text-[11px] font-semibold tracking-wide uppercase">
              Bio
            </div>
            <p className="text-portal-text1 text-sm">{athlete.bio}</p>
          </div>
        )}

        <div className="mt-6">
          <AssignedProgramsTable
            programs={assignedPrograms}
            variant="athlete"
            onAssignClick={assign.open}
            onUnassign={async (programId) => {
              await unassignProgram(programId);
            }}
          />
        </div>
      </div>

      {assign.isOpen && (
        <AssignProgramsModal
          entityName={name}
          assignedProgramIds={assignedPrograms.map((p) => p.id)}
          allPrograms={assign.programs}
          loading={assign.loading}
          onAssign={assignProgram}
          onUnassign={unassignProgram}
          onClose={assign.close}
        />
      )}
    </div>
  );
}
