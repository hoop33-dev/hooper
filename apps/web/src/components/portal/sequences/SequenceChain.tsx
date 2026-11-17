import { cn } from "@/src/lib/cn";
import { sequenceChainNames } from "@/src/lib/sequenceDisplay";
import type { ExerciseRow, PlacedSequence } from "@hooper/db";
import { resolveStepPick } from "@hooper/shared";
import { Fragment } from "react";
import { ArrowRightIcon } from "../ui/icons";
import type { EditorSequence } from "./sequenceDraft";

/** "Crossover → Skip pass → V-cut → Euro step" as plain text. */
export function SequenceChainText({
  sequence,
  setIndex = 0,
  className,
}: {
  sequence: Pick<PlacedSequence, "steps">;
  setIndex?: number;
  className?: string;
}) {
  const names = sequenceChainNames(sequence, setIndex);
  return (
    <span
      className={cn(
        "text-portal-text3 flex flex-wrap items-center gap-x-1",
        className,
      )}>
      {names.map((name, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-portal-border-mid">
              <ArrowRightIcon size={9} />
            </span>
          )}
          <span>{name}</span>
        </Fragment>
      ))}
    </span>
  );
}

/** Set 1's steps as pills, for the library list. */
export function SequenceChainChips({
  sequence,
}: {
  sequence: Pick<PlacedSequence, "steps">;
}) {
  const names = sequenceChainNames(sequence, 0);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {names.map((name, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span className="text-portal-border-mid">
              <ArrowRightIcon size={10} />
            </span>
          )}
          <span className="border-portal-border bg-portal-bg text-portal-text2 rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap">
            {name}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/** Numbered steps, for shelf cards. */
export function SequenceStepList({
  sequence,
}: {
  sequence: Pick<PlacedSequence, "steps">;
}) {
  const names = sequenceChainNames(sequence, 0);
  return (
    <div className="flex flex-col gap-0.5">
      {names.map((name, i) => (
        <div
          key={i}
          className="text-portal-text2 flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className="font-title text-portal-orange w-2 shrink-0 text-xs font-extrabold">
            {i + 1}
          </span>
          <span className="truncate">{name}</span>
        </div>
      ))}
    </div>
  );
}

/** "3 sets, Reps" style summary line. */
export function sequenceSummary(sets: number, unitTypes: string[]): string {
  return `${sets} set${sets === 1 ? "" : "s"}${unitTypes.length ? `, ${unitTypes.join(", ")}` : ""}`;
}

/** Each set's resolved steps, with the steps that changed on that set
 * highlighted. */
export function SequenceRunOrder({
  draft,
  exercisesById,
}: {
  draft: EditorSequence;
  exercisesById: Map<string, ExerciseRow>;
}) {
  return (
    <div className="border-portal-border flex shrink-0 flex-col gap-2 rounded-xl border bg-white px-4 py-3.5">
      <div className="text-portal-text3 text-[11px] font-semibold tracking-[0.1em] uppercase">
        Run order
      </div>
      {draft.sets.map((set, setIndex) => (
        <div key={setIndex} className="flex items-center gap-2.5 text-xs">
          <span className="font-title text-portal-text1 w-12 shrink-0 text-sm font-extrabold">
            SET {setIndex + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {draft.steps.map((step, i) => {
              const r = resolveStepPick(step, setIndex);
              const changed = setIndex > 0 && !r.inherited && r.exerciseId;
              return (
                <Fragment key={step.id}>
                  {i > 0 && (
                    <span className="text-portal-border-mid">
                      <ArrowRightIcon size={10} />
                    </span>
                  )}
                  <span
                    className={cn(
                      changed
                        ? "text-portal-orange font-bold"
                        : r.exerciseId
                          ? "text-portal-text2"
                          : "text-portal-text3",
                    )}>
                    {r.exerciseId
                      ? (exercisesById.get(r.exerciseId)?.name ?? "—")
                      : "—"}
                  </span>
                </Fragment>
              );
            })}
          </span>
          <span className="text-portal-text3 whitespace-nowrap">
            {set.slots
              .map(
                (s) =>
                  `${s.value ?? "–"} ${s.value_unit ?? s.unit_type.toLowerCase()}`,
              )
              .join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}
