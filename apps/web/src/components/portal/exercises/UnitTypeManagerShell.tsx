"use client";

import type { ExerciseWithDetails, UnitTypeRow } from "@hooper/db";
import { useState } from "react";
import { UnitTypeDetailPanel } from "./UnitTypeDetailPanel";
import { UnitTypeSidebar } from "./UnitTypeSidebar";

interface UnitTypeManagerShellProps {
  initialUnitTypes: UnitTypeRow[];
  exercises: ExerciseWithDetails[];
  initialSelectedId?: string;
  createAction: (data: {
    name: string;
    description: string;
    created_by: string;
  }) => Promise<{ ok: boolean; error?: string; data?: UnitTypeRow }>;
  updateAction: (
    id: string,
    data: { name?: string; description?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  profileId: string;
}

type PanelMode = "blank" | "view" | "create";

export function UnitTypeManagerShell({
  initialUnitTypes,
  exercises,
  initialSelectedId,
  createAction,
  updateAction,
  deleteAction,
  profileId,
}: UnitTypeManagerShellProps) {
  const [unitTypes, setUnitTypes] = useState(initialUnitTypes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const [mode, setMode] = useState<PanelMode>(
    initialSelectedId ? "view" : "blank",
  );

  const selectedUnitType =
    unitTypes.find((u) => u.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setMode("view");
  }
  function handleStartCreate() {
    setSelectedId(null);
    setMode("create");
  }

  async function handleCreate(data: { name: string; description: string }) {
    const result = await createAction({ ...data, created_by: profileId });
    if (result.ok && result.data) {
      setUnitTypes((prev) => [...prev, result.data!]);
      setSelectedId(result.data.id);
      setMode("view");
    }
  }

  async function handleUpdate(
    id: string,
    data: { name: string; description: string },
  ) {
    const result = await updateAction(id, data);
    if (result.ok) {
      setUnitTypes((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, name: data.name, description: data.description }
            : u,
        ),
      );
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAction(id);
    if (result.ok) {
      setUnitTypes((prev) => prev.filter((u) => u.id !== id));
      setSelectedId(null);
      setMode("blank");
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <UnitTypeSidebar
        unitTypes={unitTypes}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={handleStartCreate}
      />
      <div className="flex flex-1 overflow-hidden">
        <UnitTypeDetailPanel
          unitType={selectedUnitType}
          exercises={exercises}
          mode={mode}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onStartCreate={handleStartCreate}
        />
      </div>
    </div>
  );
}
