"use client";

import { AssignProgramPickerModal } from "@/src/components/portal/programs/AssignProgramPickerModal";
import type {
  AssignmentWithProgram,
  AthleteSummary,
  ProgramAssignmentRow,
  ProgramSummary,
  TeamRow,
  TeamSummary,
} from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { AthleteAssignmentsModal } from "./AthleteAssignmentsModal";
import { AthletesTable } from "./AthletesTable";
import { TeamCreateModal } from "./TeamCreateModal";
import { TeamsTable } from "./TeamsTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type Tab = "individuals" | "teams";
type AssignTarget =
  | { type: "team"; id: string; name: string }
  | { type: "player"; id: string; name: string };

interface AthletesPageShellProps {
  athletes: AthleteSummary[];
  teams: TeamSummary[];
  programs: ProgramSummary[];
  profileId: string;
  createTeamAction: (name: string) => Promise<ActionResult<TeamRow>>;
  loadAssignmentsAction: (
    playerId: string,
  ) => Promise<ActionResult<AssignmentWithProgram[]>>;
  revokeAssignmentAction: (id: string) => Promise<ActionResult>;
  assignToTeamAction: (input: {
    programId: string;
    teamId: string;
    assignedBy: string;
    startDate: string;
  }) => Promise<ActionResult<ProgramAssignmentRow>>;
  assignToPlayerAction: (input: {
    programId: string;
    playerId: string;
    assignedBy: string;
    startDate: string;
  }) => Promise<ActionResult<ProgramAssignmentRow>>;
}

function TabPills({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-0.5">
      {(["individuals", "teams"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-md px-3.5 py-1 text-xs font-semibold transition ${
            tab === t
              ? "border-portal-border bg-portal-card text-portal-text1 border"
              : "text-portal-text3"
          }`}>
          {t === "individuals" ? "Individuals" : "Teams"}
        </button>
      ))}
    </div>
  );
}

function EmptyIndividuals() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center">
      <p className="text-portal-text1 font-semibold">No athletes yet</p>
      <p className="text-portal-text3 max-w-sm text-sm">
        Add athletes to a team, or assign a program directly to an athlete —
        they&apos;ll show up here.
      </p>
    </div>
  );
}

function EmptyTeams({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No teams yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Create a team to start grouping your athletes
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create team
      </PortalButton>
    </div>
  );
}

function Toolbar({
  tab,
  onTabChange,
  onCreateTeamClick,
}: {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onCreateTeamClick: () => void;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex min-h-9 flex-shrink-0 items-center gap-3 border-b px-7 py-4">
      <TabPills tab={tab} onChange={onTabChange} />
      {tab === "teams" && (
        <PortalButton
          variant="primary"
          className="ml-auto"
          onClick={onCreateTeamClick}>
          Create team
        </PortalButton>
      )}
    </div>
  );
}

function PageModals({
  createOpen,
  onCreateClose,
  onCreateTeam,
  selectedAthlete,
  onSelectedClose,
  loadAssignmentsAction,
  onRevoke,
  assignTarget,
  onAssignClose,
  programs,
  onAssign,
}: {
  createOpen: boolean;
  onCreateClose: () => void;
  onCreateTeam: (name: string) => Promise<void>;
  selectedAthlete: AthleteSummary | null;
  onSelectedClose: () => void;
  loadAssignmentsAction: (
    playerId: string,
  ) => Promise<ActionResult<AssignmentWithProgram[]>>;
  onRevoke: (id: string) => Promise<void>;
  assignTarget: AssignTarget | null;
  onAssignClose: () => void;
  programs: ProgramSummary[];
  onAssign: (programId: string, startDate: string) => Promise<void>;
}) {
  return (
    <>
      {createOpen && (
        <TeamCreateModal onClose={onCreateClose} onCreate={onCreateTeam} />
      )}

      {selectedAthlete && (
        <AthleteAssignmentsModal
          athlete={selectedAthlete}
          onClose={onSelectedClose}
          onLoad={loadAssignmentsAction}
          onRevoke={onRevoke}
        />
      )}

      {assignTarget && (
        <AssignProgramPickerModal
          title={`Assign a program to ${assignTarget.name}`}
          programs={programs}
          onClose={onAssignClose}
          onAssign={onAssign}
        />
      )}
    </>
  );
}

function TabContent({
  tab,
  athletes,
  teams,
  onSelectAthlete,
  onAssignAthlete,
  onAssignTeam,
  onCreateTeamClick,
}: {
  tab: Tab;
  athletes: AthleteSummary[];
  teams: TeamSummary[];
  onSelectAthlete: (athlete: AthleteSummary) => void;
  onAssignAthlete: (athlete: AthleteSummary) => void;
  onAssignTeam: (team: TeamSummary) => void;
  onCreateTeamClick: () => void;
}) {
  if (tab === "individuals") {
    return athletes.length === 0 ? (
      <EmptyIndividuals />
    ) : (
      <AthletesTable
        athletes={athletes}
        onSelect={onSelectAthlete}
        onAssignClick={onAssignAthlete}
      />
    );
  }
  return teams.length === 0 ? (
    <EmptyTeams onCreateClick={onCreateTeamClick} />
  ) : (
    <TeamsTable teams={teams} onAssignClick={onAssignTeam} />
  );
}

export function AthletesPageShell({
  athletes,
  teams,
  programs,
  profileId,
  createTeamAction,
  loadAssignmentsAction,
  revokeAssignmentAction,
  assignToTeamAction,
  assignToPlayerAction,
}: AthletesPageShellProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [tab, setTab] = useState<Tab>("individuals");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteSummary | null>(
    null,
  );
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);

  async function handleCreateTeam(name: string) {
    const result = await createTeamAction(name);
    if (result.ok) {
      setCreateOpen(false);
      router.refresh();
    } else {
      showError(result.error ?? "Unable to create team.");
    }
  }

  async function handleRevoke(id: string) {
    const result = await revokeAssignmentAction(id);
    if (!result.ok) showError(result.error ?? "Unable to revoke assignment.");
  }

  async function handleAssign(programId: string, startDate: string) {
    if (!assignTarget) return;
    const result =
      assignTarget.type === "team"
        ? await assignToTeamAction({
            programId,
            teamId: assignTarget.id,
            assignedBy: profileId,
            startDate,
          })
        : await assignToPlayerAction({
            programId,
            playerId: assignTarget.id,
            assignedBy: profileId,
            startDate,
          });
    if (result.ok) {
      setAssignTarget(null);
      showSuccess("Program assigned.");
      router.refresh();
    } else {
      showError(result.error ?? "Unable to assign program.");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Toolbar
        tab={tab}
        onTabChange={setTab}
        onCreateTeamClick={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-7 py-2">
        <TabContent
          tab={tab}
          athletes={athletes}
          teams={teams}
          onSelectAthlete={setSelectedAthlete}
          onAssignAthlete={(a) =>
            setAssignTarget({
              type: "player",
              id: a.id,
              name: `${a.first_name} ${a.last_name}`,
            })
          }
          onAssignTeam={(t) =>
            setAssignTarget({ type: "team", id: t.id, name: t.name })
          }
          onCreateTeamClick={() => setCreateOpen(true)}
        />
      </div>

      <PageModals
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
        onCreateTeam={handleCreateTeam}
        selectedAthlete={selectedAthlete}
        onSelectedClose={() => setSelectedAthlete(null)}
        loadAssignmentsAction={loadAssignmentsAction}
        onRevoke={handleRevoke}
        assignTarget={assignTarget}
        onAssignClose={() => setAssignTarget(null)}
        programs={programs}
        onAssign={handleAssign}
      />
    </div>
  );
}
