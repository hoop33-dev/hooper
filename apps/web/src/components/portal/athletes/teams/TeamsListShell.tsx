"use client";

import { uploadTeamAvatar } from "@/src/services/teamAvatar.client";
import type { TeamRow, TeamSummary } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton } from "../../ui/PortalButton";
import { TeamCreateModal, type TeamCreateFormData } from "./TeamCreateModal";
import { TeamsTable } from "./TeamsTable";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamsListShellProps {
  teams: TeamSummary[];
  createAction: (data: {
    name: string;
    description?: string;
  }) => Promise<ActionResult<TeamRow>>;
  updateAvatarAction: (
    id: string,
    data: { avatar_url: string },
  ) => Promise<ActionResult<TeamRow>>;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
      <div className="text-center">
        <p className="text-portal-text1 font-semibold">No teams yet</p>
        <p className="text-portal-text3 mt-1 text-sm">
          Create a team to group athletes and assign programs together
        </p>
      </div>
      <PortalButton variant="primary" onClick={onCreateClick}>
        Create team
      </PortalButton>
    </div>
  );
}

export function TeamsListShell({
  teams,
  createAction,
  updateAvatarAction,
}: TeamsListShellProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(data: TeamCreateFormData): Promise<ActionResult> {
    const result = await createAction({
      name: data.name,
      description: data.description,
    });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error };
    }

    if (data.avatarFile) {
      // The team row already exists at this point, so avatar failures are
      // reported as a warning rather than an overall failure — treating
      // them as `ok: false` would let the user retry and create a
      // duplicate team.
      const uploadResult = await uploadTeamAvatar(
        result.data.id,
        data.avatarFile,
      );
      if (uploadResult.ok) {
        const avatarUpdateResult = await updateAvatarAction(result.data.id, {
          avatar_url: uploadResult.data,
        });
        if (!avatarUpdateResult.ok) {
          console.error(
            "Failed to save team avatar:",
            avatarUpdateResult.error,
          );
        }
      } else {
        console.error("Failed to upload team avatar:", uploadResult.error);
      }
    }

    router.refresh();
    return { ok: true };
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
