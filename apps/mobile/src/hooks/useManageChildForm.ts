import { useEffect, useState } from "react";

import {
  getChildProfile,
  updateChildProfile,
} from "@/src/services/parent.service";

export type SaveOutcome = { ok: true } | { ok: false; alert?: string };

/**
 * Loads a child's editable profile and exposes form state + a save action for
 * the Manage child screen. Username validation errors surface on
 * `usernameError`; other failures come back as `alert` from save().
 */
export function useManageChildForm(childId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lock, setLock] = useState(false);
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    void (async () => {
      const c = await getChildProfile(childId);
      if (cancelled) return;
      if (c) {
        setFirstName(c.firstName);
        setLastName(c.lastName);
        setUsername(c.username);
        setRegionId(c.regionId);
        setDob(c.dateOfBirth);
        setAvatarUrl(c.avatarUrl);
        setLock(c.profileSettingsLocked);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  async function save(avatarUrl?: string): Promise<SaveOutcome> {
    if (!childId) return { ok: false };
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setUsernameError(username.trim() ? undefined : "Required");
      return { ok: false };
    }
    setSaving(true);
    setUsernameError(undefined);
    const result = await updateChildProfile({
      childProfileId: childId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      dateOfBirth: dob ? new Date(dob) : null,
      regionId,
      profileSettingsLocked: lock,
      avatarUrl,
    });
    setSaving(false);
    if (result.ok) return { ok: true };
    if (result.field === "username") {
      setUsernameError(result.error);
      return { ok: false };
    }
    return { ok: false, alert: result.error };
  }

  return {
    loading,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    username,
    setUsername,
    regionId,
    setRegionId,
    dob,
    avatarUrl,
    lock,
    setLock,
    usernameError,
    setUsernameError,
    saving,
    save,
  };
}

export type ManageChildForm = ReturnType<typeof useManageChildForm>;
