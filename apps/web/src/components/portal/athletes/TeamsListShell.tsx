"use client";

import type { TeamRow, TeamSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { TeamCreateModal } from "./TeamCreateModal";
import { TeamsTable } from "./TeamsTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamsListShellProps {
  teams: TeamSummary[];
  createAction: (name: string) => Promise<ActionResult<TeamRow>>;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
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

export function TeamsListShell({ teams, createAction }: TeamsListShellProps) {
  const router = useRouter();
  const { showError } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(name: string) {
    const result = await createAction(name);
    if (result.ok) {
      setCreateOpen(false);
      router.refresh();
    } else {
      showError(result.error ?? "Unable to create team.");
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-portal-border bg-portal-card flex flex-shrink-0 items-center gap-3 border-b px-7 py-4">
        <PortalButton
          variant="primary"
          className="ml-auto"
          onClick={() => setCreateOpen(true)}>
          Create team
        </PortalButton>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-2">
        {teams.length === 0 ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <TeamsTable teams={teams} />
        )}
      </div>

      {createOpen && (
        <TeamCreateModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
