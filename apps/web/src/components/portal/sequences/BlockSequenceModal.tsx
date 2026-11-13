"use client";

import type { BlockSequenceSaveData } from "@/src/components/portal/programs/useBlockActions";
import type { LinkScope } from "@/src/services/block.service";
import type { BlockExerciseWithDetails, UnitTypeRow } from "@hooper/db";
import { useMemo, useState } from "react";
import { ScopeChoiceFooter } from "../programs/BlockExerciseMeasurementModal";
import { ChainIcon, CopyIcon, XIcon } from "../ui/icons";
import { PortalButton } from "../ui/PortalButton";
import { useToast } from "../ui/Toast";
import { useModalDismiss } from "../ui/useModalDismiss";
import {
  draftFromPlacement,
  draftToPlaced,
  toSequenceInput,
  type EditorSequence,
} from "./sequenceDraft";
import { SequenceGrid, SequenceLegend } from "./SequenceGrid";
import { SequenceHeader } from "./SequenceHeader";
import type { SequenceSupport } from "./SequenceSupportContext";
import {
  useSequenceEditor,
  type SequenceEditorActions,
} from "./useSequenceEditor";

function ModalHead({
  where,
  draft,
  actions,
  unitTypes,
  autoFocusName,
  onSaveAsNew,
  onClose,
}: {
  where?: string;
  draft: EditorSequence;
  actions: SequenceEditorActions;
  unitTypes: UnitTypeRow[];
  autoFocusName: boolean;
  onSaveAsNew?: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="border-portal-border flex flex-shrink-0 flex-col gap-3.5 border-b px-5 pt-4 pb-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-portal-text3 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            <span className="text-portal-orange">
              <ChainIcon size={12} />
            </span>
            {where ?? "Sequence"}
          </div>
          <input
            value={draft.name}
            placeholder="Name this sequence"
            autoFocus={autoFocusName}
            // A fresh sequence starts as "Untitled sequence": select it so
            // typing replaces it.
            onFocus={(e) => autoFocusName && e.currentTarget.select()}
            onChange={(e) => actions.setName(e.target.value)}
            className="font-title text-portal-text1 placeholder:text-portal-text3 mt-0.5 w-full bg-transparent p-0 text-[26px] font-extrabold tracking-wide outline-none"
          />
        </div>
        {onSaveAsNew && (
          <PortalButton size="sm" onClick={() => void onSaveAsNew()}>
            <CopyIcon size={12} /> Save as new sequence
          </PortalButton>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="border-portal-border text-portal-text2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
          <XIcon />
        </button>
      </div>
      <SequenceHeader draft={draft} actions={actions} unitTypes={unitTypes} />
    </div>
  );
}

function ModalFoot({
  choosingScope,
  linkedWeeks,
  saving,
  onChooseScope,
  onBack,
  onClose,
  onSave,
}: {
  choosingScope: boolean;
  linkedWeeks?: number[];
  saving: boolean;
  onChooseScope: (scope: LinkScope) => void;
  onBack: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (choosingScope && linkedWeeks) {
    return (
      <ScopeChoiceFooter
        linkedWeeks={linkedWeeks}
        onChoose={onChooseScope}
        onBack={onBack}
        saving={saving}
      />
    );
  }
  return (
    <div className="border-portal-border flex flex-shrink-0 items-center justify-end gap-2 border-t px-5 py-3">
      <span className="text-portal-text3 mr-auto text-xs">
        Changes apply to this program only.
      </span>
      <PortalButton size="sm" onClick={onClose}>
        Cancel
      </PortalButton>
      <PortalButton
        size="sm"
        variant="primary"
        disabled={saving}
        onClick={onSave}>
        {saving ? "Saving…" : "Save changes"}
      </PortalButton>
    </div>
  );
}

/** Saving the placement, and copying it into the library. */
function usePlacementSave(
  draft: EditorSequence,
  sourceSequenceId: string | null,
  support: SequenceSupport,
  onSave: (data: BlockSequenceSaveData, scope?: LinkScope) => Promise<void>,
) {
  const { showError, showSuccess } = useToast();
  const [saving, setSaving] = useState(false);
  const exercisesById = useMemo(
    () => new Map(support.library.exercises.map((e) => [e.id, e])),
    [support.library.exercises],
  );

  async function commit(scope?: LinkScope) {
    setSaving(true);
    const input = toSequenceInput(draft);
    await onSave(
      {
        sets: draft.sets.length,
        measurements: draft.sets,
        sequence: {
          name: input.name,
          description: input.description,
          steps: input.steps,
        },
        placed: draftToPlaced(draft, exercisesById, sourceSequenceId),
      },
      scope,
    );
    setSaving(false);
  }

  async function saveAsNew() {
    if (!support.createSequenceAction) return;
    const result = await support.createSequenceAction(toSequenceInput(draft));
    if (result.ok)
      showSuccess(
        `Saved "${draft.name.trim() || "Untitled sequence"}" to Sequences.`,
      );
    else showError(result.error ?? "Failed to save sequence.");
  }

  return { saving, commit, saveAsNew };
}

/** Edits a sequence placed in a block. Changes apply to this placement
 * only; "Save as new sequence" copies it into the library. */
export function BlockSequenceModal({
  blockExercise,
  where,
  lockedSets,
  linkedWeeks,
  support,
  onClose,
  onSave,
}: {
  blockExercise: BlockExerciseWithDetails & {
    sequence: NonNullable<BlockExerciseWithDetails["sequence"]>;
  };
  /** Context line above the name, e.g. the block's name. */
  where?: string;
  lockedSets?: number;
  linkedWeeks?: number[];
  support: SequenceSupport;
  onClose: () => void;
  onSave: (data: BlockSequenceSaveData, scope?: LinkScope) => Promise<void>;
}) {
  const { draft, actions, lockSets } = useSequenceEditor(
    () =>
      draftFromPlacement(
        blockExercise.sequence,
        blockExercise.measurements,
        blockExercise.sets,
      ),
    lockedSets,
  );
  const [choosingScope, setChoosingScope] = useState(false);
  const onBackdropClick = useModalDismiss(onClose);
  const { saving, commit, saveAsNew } = usePlacementSave(
    draft,
    blockExercise.sequence.sourceSequenceId,
    support,
    onSave,
  );

  return (
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit sequence"
        className="bg-portal-card flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl shadow-2xl">
        <ModalHead
          where={where}
          draft={draft}
          actions={actions}
          unitTypes={support.unitTypes}
          autoFocusName={!blockExercise.sequence.sourceSequenceId}
          onSaveAsNew={support.createSequenceAction ? saveAsNew : undefined}
          onClose={onClose}
        />
        <div className="bg-portal-bg flex flex-1 flex-col gap-3 overflow-y-auto px-5 pt-4 pb-6">
          <SequenceGrid
            draft={draft}
            actions={actions}
            library={support.library}
            lockSets={lockSets}
            compact
          />
          <SequenceLegend />
          {lockSets && (
            <p className="text-portal-text3 text-[11px]">
              In a superset this sequence runs once per round. Change the round
              count on the block.
            </p>
          )}
        </div>
        <ModalFoot
          choosingScope={choosingScope}
          linkedWeeks={linkedWeeks}
          saving={saving}
          onChooseScope={(scope) => void commit(scope)}
          onBack={() => setChoosingScope(false)}
          onClose={onClose}
          onSave={() =>
            linkedWeeks && linkedWeeks.length > 1
              ? setChoosingScope(true)
              : void commit()
          }
        />
      </div>
    </div>
  );
}
