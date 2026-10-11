"use client";

import { CheckIcon } from "@/src/components/icons";
import { Btn } from "@/src/components/ui/Btn";
import { Label } from "@/src/components/ui/primitives";
import { Sheet } from "@/src/components/ui/Sheet";
import { cn } from "@/src/lib/cn";
import { formatDate } from "@/src/lib/format";
import type { MyPackagePurchase } from "@hooper/db";
import { useState } from "react";

const REASONS = [
  "Season is over",
  "Too expensive",
  "Not using it",
  "Changing coach",
  "Other",
];

/** Design `StopSheet`, end-of-period only. A failed (past_due) membership
 * has no paid period left, so it stops today instead. */
export function StopSheet({
  purchase: p,
  whose,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  purchase: MyPackagePurchase;
  /** "Your" or "Liam's". */
  whose: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reason: string | null) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const failed = p.status === "past_due";
  const end = p.current_period_end ? formatDate(p.current_period_end) : null;
  const when = failed || !end ? "today" : `on ${end}`;
  const programs = p.program_names;
  const app = whose === "Your" ? "your" : whose;

  return (
    <Sheet
      title={`Stop ${p.package_name}`}
      sub={`${whose} membership`}
      onClose={onClose}
      locked={saving}
      foot={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            Keep membership
          </Btn>
          <Btn
            variant="destructive"
            loading={saving}
            onClick={() => onConfirm(reason)}>
            Stop membership
          </Btn>
        </>
      }>
      <Label className="mb-2.5">When</Label>
      <WhenChoice
        {...(failed
          ? {
              label: "Today",
              sub: "Access ends now. The failed charge is cancelled",
            }
          : {
              label: end
                ? `At the end of this period on ${end}`
                : "At the end of this period",
              sub: "Keep access until then. No more charges",
            })}
      />
      <Consequences
        items={[
          programs.length > 0
            ? `${programs.join(", ")} ${programs.length > 1 ? "leave" : "leaves"} ${app} app ${when}`
            : `Access ends ${when}`,
          "Logged sessions and progress stay on the account",
          "You can buy it again from your coach's link any time",
        ]}
      />
      <Label className="mt-[18px] mb-2.5">
        Why are you stopping? (optional)
      </Label>
      <ReasonChips value={reason} onChange={setReason} />
      {error && (
        <div role="alert" className="text-danger mt-3.5 text-[12.5px]">
          {error}
        </div>
      )}
    </Sheet>
  );
}

/** The one (pre-selected) timing option, styled like the design's
 * `ChoiceList` so the sheet still says plainly when it ends. */
function WhenChoice({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="border-orange bg-orange/10 flex items-start gap-3 rounded-[10px] border px-3.5 py-3">
      <div className="border-orange bg-orange mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-white">
        <CheckIcon size={10} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-bp-text1 text-[13.5px] font-bold">{label}</div>
        <div className="text-bp-text2 mt-0.5 text-[12.5px] leading-[1.45]">
          {sub}
        </div>
      </div>
    </div>
  );
}

function Consequences({ items }: { items: string[] }) {
  return (
    <ul className="bg-bp-bg mt-4 rounded-[10px] px-3.5 py-1">
      {items.map((t, i) => (
        <li
          key={t}
          className={cn(
            "text-bp-text2 flex gap-2.5 py-2.5 text-[12.5px] leading-[1.45]",
            i < items.length - 1 && "border-bp-border border-b",
          )}>
          <span className="bg-bp-text3 mt-[7px] size-[5px] shrink-0 rounded-full" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function ReasonChips({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (reason: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {REASONS.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={value === r}
          onClick={() => onChange(value === r ? null : r)}
          className={cn(
            "rounded-full border px-[13px] py-[7px] text-[12.5px] font-semibold",
            value === r
              ? "border-ink bg-ink text-white"
              : "border-bp-border bg-bp-card text-bp-text2",
          )}>
          {r}
        </button>
      ))}
    </div>
  );
}
