"use client";

import type {
  AssignmentWithProgram,
  AthleteSummary,
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

interface AthletesPageShellProps {
  athletes: AthleteSummary[];
  teams: TeamSummary[];
  createTeamAction: (name: string) => Promise<ActionResult<TeamRow>>;
  loadAssignmentsAction: (
    playerId: string,
  ) => Promise<ActionResult<AssignmentWithProgram[]>>;
  revokeAssignmentAction: (id: string) => Promise<ActionResult>;
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

export function AthletesPageShell({
  athletes,
  teams,
  createTeamAction,
  loadAssignmentsAction,
  revokeAssignmentAction,
}: AthletesPageShellProps) {
  const router = useRouter();
  const { showError } = useToast();
  const [tab, setTab] = useState<Tab>("individuals");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteSummary | null>(
    null,
  );

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <TabPills tab={tab} onChange={setTab} />
        {tab === "teams" && (
          <PortalButton
            variant="primary"
            className="ml-auto"
            onClick={() => setCreateOpen(true)}>
            Create team
          </PortalButton>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {tab === "individuals" ? (
          athletes.length === 0 ? (
            <EmptyIndividuals />
          ) : (
            <AthletesTable athletes={athletes} onSelect={setSelectedAthlete} />
          )
        ) : teams.length === 0 ? (
          <EmptyTeams onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <TeamsTable teams={teams} />
        )}
      </div>

      {createOpen && (
        <TeamCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateTeam}
        />
      )}

      {selectedAthlete && (
        <AthleteAssignmentsModal
          athlete={selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
          onLoad={loadAssignmentsAction}
          onRevoke={handleRevoke}
        />
      )}
    </div>
  );
}
