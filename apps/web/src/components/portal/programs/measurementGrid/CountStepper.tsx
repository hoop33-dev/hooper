"use client";

function StepButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-portal-border bg-portal-bg text-portal-text2 h-7 w-7 flex-shrink-0 rounded-lg border">
      {children}
    </button>
  );
}

/** Labeled +/- stepper for a top-level count (a placement's Sets, a
 * superset block's Rounds) — shared so both live in one place instead of
 * two near-identical copies. */
export function CountStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-portal-text2 w-14 flex-shrink-0 text-xs font-bold">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <StepButton onClick={() => onChange(Math.max(1, value - 1))}>
          −
        </StepButton>
        <span className="font-title text-portal-text1 w-full flex-1 text-center text-lg font-black">
          {value}
        </span>
        <StepButton onClick={() => onChange(value + 1)}>+</StepButton>
      </div>
    </div>
  );
}
