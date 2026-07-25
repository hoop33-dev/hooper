"use client";

import type { ProgramSummary } from "@hooper/db";
import { useState } from "react";
import { InlineConfirmDelete } from "../ui/InlineConfirmDelete";
import { PortalInput } from "../ui/PortalInput";

interface AttachedProgramsPanelProps {
  formId: string;
  programs: ProgramSummary[];
  onAttach: (programId: string) => Promise<void>;
  onDetach: (programId: string) => Promise<void>;
}

function SearchCard({
  candidates,
  onAttach,
}: {
  candidates: ProgramSummary[];
  onAttach: (programId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");

  const filtered =
    search.trim().length === 0
      ? []
      : candidates.filter((p) =>
          p.name.toLowerCase().includes(search.trim().toLowerCase()),
        );

  // Attaching is optimistic (see useFormEditorState) — the matched program
  // drops out of `candidates` the instant it's clicked, so there's nothing
  // to disable/spin here; just clear the search to reveal the empty result.
  function handleAttach(programId: string) {
    onAttach(programId);
    setSearch("");
  }

  return (
    <div className="border-portal-border bg-portal-card rounded-xl border p-4">
      <PortalInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search programs by name…"
      />
      {filtered.length > 0 && (
        <div className="border-portal-border mt-2 max-h-48 overflow-y-auto rounded-lg border">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleAttach(p.id)}
              className="border-portal-border hover:bg-portal-bg text-portal-text1 flex w-full items-center border-b px-3 py-2 text-left text-xs font-semibold last:border-b-0">
              {p.name}
            </button>
          ))}
        </div>
      )}
      {search.trim().length > 0 && filtered.length === 0 && (
        <p className="text-portal-text3 mt-2 text-xs">No matching programs.</p>
      )}
    </div>
  );
}

function AttachedProgramCard({
  program,
  onDetach,
}: {
  program: ProgramSummary;
  onDetach: () => Promise<void>;
}) {
  return (
    <div className="border-portal-border bg-portal-card flex items-center gap-3 rounded-xl border px-4 py-3.5">
      <span className="text-portal-text1 flex-1 truncate text-sm font-semibold">
        {program.name}
      </span>
      <InlineConfirmDelete
        onDelete={onDetach}
        idleTitle="Detach"
        idleClassName="text-portal-text3 hover:text-red-500"
      />
    </div>
  );
}

export function AttachedProgramsPanel({
  formId,
  programs,
  onAttach,
  onDetach,
}: AttachedProgramsPanelProps) {
  const attached = programs.filter((p) => p.form_id === formId);
  const unattached = programs.filter((p) => p.form_id === null);

  return (
    <div>
      <h3 className="text-portal-text1 mb-3 text-sm font-bold">
        Attached programs
      </h3>
      <div className="flex flex-col gap-2">
        <SearchCard candidates={unattached} onAttach={onAttach} />
        {attached.length === 0 ? (
          <p className="text-portal-text3 px-1 text-xs">
            Not attached to any programs yet.
          </p>
        ) : (
          attached.map((program) => (
            <AttachedProgramCard
              key={program.id}
              program={program}
              onDetach={() => onDetach(program.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
