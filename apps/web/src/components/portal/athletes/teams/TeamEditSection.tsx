"use client";

import type { TeamDetail, TeamRow } from "@hooper/db";
import { TeamEditDrawer } from "./TeamEditDrawer";
import { useTeamDetailForm } from "./useTeamDetailForm";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface TeamEditSectionProps {
  team: TeamDetail;
  open: boolean;
  onClose: () => void;
  onOptimisticSave: (data: {
    name: string;
    description: string | null;
  }) => void;
  updateTeamAction: (
    id: string,
    data: { name?: string; description?: string | null; avatar_url?: string },
  ) => Promise<ActionResult<TeamRow>>;
  deleteTeamAction: (id: string) => Promise<ActionResult>;
}

/** The team edit drawer plus its form state — split out of TeamDetailShell so
 * the shell stays layout-only. */
export function TeamEditSection({
  team,
  open,
  onClose,
  onOptimisticSave,
  updateTeamAction,
  deleteTeamAction,
}: TeamEditSectionProps) {
  const form = useTeamDetailForm({
    team,
    updateTeamAction,
    deleteTeamAction,
    onOptimisticSave,
  });

  async function handleSaveAndClose() {
    if (await form.handleSave()) onClose();
  }

  if (!open) return null;

  return (
    <TeamEditDrawer
      team={team}
      name={form.name}
      onName={form.setName}
      description={form.description}
      onDescription={form.setDescription}
      saving={form.saving}
      uploadingAvatar={form.uploadingAvatar}
      error={form.error}
      dirty={form.dirty}
      onSave={handleSaveAndClose}
      onAvatarSelected={form.handleAvatarSelected}
      onDelete={form.handleDelete}
      onClose={() => {
        form.resetForm();
        onClose();
      }}
    />
  );
}
