"use client";

import { Radio } from "@/src/components/auth/AuthWrap";
import { PlusIcon } from "@/src/components/icons";
import { Avatar } from "@/src/components/ui/primitives";
import type { ForChoice } from "@/src/lib/checkoutFor";
import { cn } from "@/src/lib/cn";
import { fullName, initials } from "@/src/lib/format";
import type { MyChild } from "@hooper/db";
import { ageFromDob } from "@hooper/shared";

const TONES = ["orange", "navy", "slate", "blue"] as const;

/** Radio list of the user's children plus "Add a new child" (the design's
 * CheckoutSignIn picker). */
export function ChildPicker({
  childList,
  choice,
  onChange,
  disabled,
}: {
  childList: MyChild[];
  choice: ForChoice;
  onChange: (choice: ForChoice) => void;
  disabled?: boolean;
}) {
  const isNew = choice.who === "new_child";
  return (
    <div
      role="radiogroup"
      aria-label="Which child?"
      className="mt-3 flex flex-col gap-2">
      {childList.map((c, i) => {
        const on = choice.who === "child" && choice.childId === c.profile_id;
        const age = ageFromDob(c.date_of_birth);
        return (
          <PickerRow
            key={c.profile_id}
            on={on}
            disabled={disabled}
            onSelect={() => onChange({ who: "child", childId: c.profile_id })}>
            <Avatar
              initials={initials(c.first_name, c.last_name)}
              size={30}
              tone={TONES[i % TONES.length]}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">
                {fullName(c.first_name, c.last_name) || c.username}
              </div>
              <div className="text-xs text-white/40">
                {age !== null ? `Age ${age}` : `@${c.username}`}
              </div>
            </div>
          </PickerRow>
        );
      })}
      <PickerRow
        on={isNew}
        disabled={disabled}
        onSelect={() => onChange({ who: "new_child" })}>
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-white/10 text-white/60">
          <PlusIcon size={14} />
        </div>
        <div className="text-sm font-bold text-white">Add a new child</div>
      </PickerRow>
    </div>
  );
}

function PickerRow({
  on,
  disabled,
  onSelect,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
        on
          ? "border-orange/25 bg-orange/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}>
      <Radio on={on} />
      {children}
    </button>
  );
}
