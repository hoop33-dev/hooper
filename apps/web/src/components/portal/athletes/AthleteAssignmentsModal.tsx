"use client";

import { AssignedProgramsList } from "@/src/components/portal/programs/AssignedProgramsList";
import type { AssignmentWithProgram, AthleteSummary } from "@hooper/db";
import { useEffect, useState } from "react";
import { ModalHeader } from "../ui/ModalHeader";
import { PortalAvatar } from "../ui/PortalAvatar";
import { useModalDismiss } from "../ui/useModalDismiss";

type ActionResult<T = undefined> = { ok: boolean; error?: string; data?: T };

interface AthleteAssignmentsModalProps {
  athlete: AthleteSummary;
  onClose: () => void;
  onLoad: (playerId: string) => Promise<ActionResult<AssignmentWithProgram[]>>;
  onRevoke: (id: string) => Promise<void>;
}

export function AthleteAssignmentsModal({
  athlete,
  onClose,
  onLoad,
  onRevoke,
}: AthleteAssignmentsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithProgram[]>([]);
  const onBackdropClick = useModalDismiss(onClose);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await onLoad(athlete.id);
      if (cancelled) return;
      if (result.ok) {
        setAssignments(result.data ?? []);
      } else {
        setError(result.error ?? "Unable to load assigned programs.");
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [athlete.id, onLoad]);

  async function handleRevoke(id: string) {
    await onRevoke(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-portal-card w-full max-w-lg rounded-2xl shadow-2xl">
        <ModalHeader title="Assigned programs" onClose={onClose} />

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <PortalAvatar
              firstName={athlete.first_name}
              avatarUrl={athlete.avatar_url}
              size={40}
            />
            <div>
              <div className="text-portal-text1 text-[13px] font-bold">
                {athlete.first_name} {athlete.last_name}
              </div>
              <div className="text-portal-text3 text-xs">
                @{athlete.username}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-portal-text3 text-xs">Loading…</p>
          ) : error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : (
            <AssignedProgramsList
              assignments={assignments}
              onRevoke={handleRevoke}
              emptyMessage="No programs assigned to this athlete yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}
