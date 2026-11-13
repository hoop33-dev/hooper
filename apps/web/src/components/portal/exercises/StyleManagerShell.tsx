"use client";

import type { ExerciseStyleRow, ExerciseWithDetails } from "@hooper/db";
import { useState } from "react";
import { StyleDetailPanel } from "./StyleDetailPanel";
import { StyleSidebar } from "./StyleSidebar";

interface StyleManagerShellProps {
  initialStyles: ExerciseStyleRow[];
  exercises: ExerciseWithDetails[];
  initialSelectedId?: string;
  createAction: (data: {
    name: string;
    description: string;
    created_by: string;
  }) => Promise<{ ok: boolean; error?: string; data?: ExerciseStyleRow }>;
  updateAction: (
    id: string,
    data: { name?: string; description?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  profileId: string;
}

type PanelMode = "blank" | "view" | "create";

export function StyleManagerShell({
  initialStyles,
  exercises,
  initialSelectedId,
  createAction,
  updateAction,
  deleteAction,
  profileId,
}: StyleManagerShellProps) {
  const [styles, setStyles] = useState(initialStyles);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const [mode, setMode] = useState<PanelMode>(
    initialSelectedId ? "view" : "blank",
  );

  const selectedStyle = styles.find((s) => s.id === selectedId) ?? null;

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
      setStyles((prev) => [...prev, result.data!]);
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
      setStyles((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, name: data.name, description: data.description }
            : s,
        ),
      );
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteAction(id);
    if (result.ok) {
      setStyles((prev) => prev.filter((s) => s.id !== id));
      setSelectedId(null);
      setMode("blank");
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <StyleSidebar
        styles={styles}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCreate={handleStartCreate}
      />
      <div className="flex flex-1 overflow-hidden">
        <StyleDetailPanel
          style={selectedStyle}
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
