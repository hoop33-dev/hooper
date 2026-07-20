"use client";

import { AthleteUsernameSearch } from "@/src/components/portal/athletes/AthleteUsernameSearch";
import type { AthleteMatch, TeamSummary } from "@hooper/db";
import { useState } from "react";
import { ModalHeader } from "../ui/ModalHeader";
import { PortalButton } from "../ui/PortalButton";
import { PortalInput } from "../ui/PortalInput";
import { useModalDismiss } from "../ui/useModalDismiss";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };
type AssignTarget = "team" | "individual";

function todayLocalDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface AssignProgramModalProps {
  onClose: () => void;
  teams: TeamSummary[];
  onLookupAthlete: (
    username: string,
  ) => Promise<ActionResult<AthleteMatch | null>>;
  onAssignToTeam: (teamId: string, startDate: string) => Promise<void>;
  onAssignToPlayer: (playerId: string, startDate: string) => Promise<void>;
}

function TargetToggle({
  target,
  onChange,
}: {
  target: AssignTarget;
  onChange: (t: AssignTarget) => void;
}) {
  return (
    <div className="border-portal-border bg-portal-bg flex gap-0.5 rounded-lg border p-0.5">
      {(["team", "individual"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
            target === t
              ? "border-portal-border bg-portal-card text-portal-text1 border"
              : "text-portal-text3"
          }`}>
          {t === "team" ? "Team" : "Individual athlete"}
        </button>
      ))}
    </div>
  );
}

function TeamPicker({
  teams,
  teamId,
  onChange,
}: {
  teams: TeamSummary[];
  teamId: string;
  onChange: (id: string) => void;
}) {
  if (teams.length === 0) {
    return (
      <p className="text-portal-text3 text-xs">
        You don&apos;t have any teams yet. Create one from the Athletes page
        first.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="text-portal-text2 text-xs font-semibold">Team</label>
      <select
        value={teamId}
        onChange={(e) => onChange(e.target.value)}
        className="border-portal-border bg-portal-card text-portal-text1 focus:border-portal-orange focus:ring-portal-orange h-9 w-full rounded-lg border px-3 text-sm focus:ring-1 focus:outline-none">
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.memberCount}{" "}
            {t.memberCount === 1 ? "athlete" : "athletes"}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AssignProgramModal({
  onClose,
  teams,
  onLookupAthlete,
  onAssignToTeam,
  onAssignToPlayer,
}: AssignProgramModalProps) {
  const [target, setTarget] = useState<AssignTarget>("team");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [match, setMatch] = useState<AthleteMatch | null | undefined>(
    undefined,
  );
  const [startDate, setStartDate] = useState(todayLocalDate());
  const [assigning, setAssigning] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);

  async function handleAssign() {
    if (assigning || !startDate) return;
    setAssigning(true);
    if (target === "team") {
      if (teamId) await onAssignToTeam(teamId, startDate);
    } else if (match) {
      await onAssignToPlayer(match.id, startDate);
    }
    setAssigning(false);
  }

  const canAssign =
    !assigning && !!startDate && (target === "team" ? !!teamId : !!match);

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-md rounded-2xl shadow-2xl">
        <ModalHeader title="Assign program" onClose={onClose} />

        <div className="flex flex-col gap-4 px-6 py-5">
          <TargetToggle target={target} onChange={setTarget} />

          {target === "team" ? (
            <TeamPicker teams={teams} teamId={teamId} onChange={setTeamId} />
          ) : (
            <AthleteUsernameSearch
              onLookup={onLookupAthlete}
              match={match}
              onMatchChange={setMatch}
            />
          )}

          <PortalInput
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="border-portal-border flex justify-end gap-2 border-t px-6 py-4">
          <PortalButton variant="ghost" onClick={onClose} disabled={assigning}>
            Cancel
          </PortalButton>
          <PortalButton
            variant="primary"
            onClick={handleAssign}
            disabled={!canAssign}>
            {assigning ? "Assigning…" : "Assign"}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
