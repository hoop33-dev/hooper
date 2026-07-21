"use client";

import type { AthleteMatch } from "@hooper/db";
import { useState } from "react";
import { PortalAvatar } from "../ui/PortalAvatar";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface AthleteUsernameSearchProps {
  onLookup: (username: string) => Promise<ActionResult<AthleteMatch | null>>;
  match: AthleteMatch | null | undefined;
  onMatchChange: (match: AthleteMatch | null | undefined) => void;
  /** Player ids to flag as already-added instead of selectable. */
  disabledIds?: string[];
  disabledLabel?: string;
}

/** Exact-username search box + result card, shared by AddAthleteModal
 * (rostering) and AssignProgramModal (individual assignment) — both need
 * the same "find one athlete by handle" flow against lookup_athlete_by_username. */
export function AthleteUsernameSearch({
  onLookup,
  match,
  onMatchChange,
  disabledIds = [],
  disabledLabel = "Already added",
}: AthleteUsernameSearchProps) {
  const [username, setUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = username.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    setError(null);
    onMatchChange(undefined);
    const result = await onLookup(trimmed);
    setSearching(false);
    if (!result.ok) {
      setError(result.error ?? "Unable to search right now.");
      return;
    }
    onMatchChange(result.data ?? null);
  }

  const disabled = match ? disabledIds.includes(match.id) : false;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <PortalInput
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              onMatchChange(undefined);
              setError(null);
            }}
            placeholder="e.g. jsmith23"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <PortalButton
          variant="secondary"
          onClick={handleSearch}
          disabled={searching || !username.trim()}>
          {searching ? "Searching…" : "Search"}
        </PortalButton>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {match === null && !error && (
        <p className="text-portal-text3 text-xs">
          No athlete found with that username.
        </p>
      )}
      {match && (
        <div className="border-portal-border bg-portal-bg flex items-center gap-3 rounded-lg border p-3">
          <PortalAvatar
            firstName={match.first_name}
            avatarUrl={match.avatar_url}
          />
          <div className="min-w-0 flex-1">
            <div className="text-portal-text1 truncate text-[13px] font-bold">
              {match.first_name} {match.last_name}
            </div>
            <div className="text-portal-text3 truncate text-xs">
              @{match.username}
            </div>
          </div>
          {disabled && (
            <span className="text-portal-text3 text-xs">{disabledLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
