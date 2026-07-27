"use client";

import { uploadTeamAvatar } from "@/src/services/teamAvatar.client";
import type { TeamDetail, TeamRow } from "@hooper/db";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface UseTeamDetailFormArgs {
  team: TeamDetail;
  updateTeamAction: (
    id: string,
    data: { name?: string; description?: string | null; avatar_url?: string },
  ) => Promise<ActionResult<TeamRow>>;
  deleteTeamAction: (id: string) => Promise<ActionResult>;
}

export function useTeamDetailForm({
  team,
  updateTeamAction,
  deleteTeamAction,
}: UseTeamDetailFormArgs) {
  const router = useRouter();
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    name.trim() !== team.name ||
    description.trim() !== (team.description ?? "");

  async function handleSave(): Promise<boolean> {
    if (!name.trim() || saving) return false;
    setSaving(true);
    setError(null);
    const result = await updateTeamAction(team.id, {
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
    });
    setSaving(false);
    if (result.ok) {
      router.refresh();
      return true;
    }
    setError(result.error ?? "Failed to save changes.");
    return false;
  }

  async function handleAvatarSelected(file: File) {
    setUploadingAvatar(true);
    setError(null);
    const uploadResult = await uploadTeamAvatar(team.id, file);
    if (!uploadResult.ok) {
      setUploadingAvatar(false);
      setError(uploadResult.error);
      return;
    }
    await updateTeamAction(team.id, { avatar_url: uploadResult.data });
    setUploadingAvatar(false);
    router.refresh();
  }

  async function handleDelete() {
    const result = await deleteTeamAction(team.id);
    if (result.ok) router.push("/athletes/teams");
  }

  return {
    name,
    setName,
    description,
    setDescription,
    saving,
    uploadingAvatar,
    error,
    dirty,
    handleSave,
    handleAvatarSelected,
    handleDelete,
  };
}
