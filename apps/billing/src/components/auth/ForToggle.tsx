"use client";

import { UserIcon, UsersIcon } from "@/src/components/icons";
import { cn } from "@/src/lib/cn";

/** "For me / For my child" segmented control (design `ForToggle`). */
export function ForToggle({
  forChild,
  onChange,
  disabled,
}: {
  forChild: boolean;
  onChange: (forChild: boolean) => void;
  disabled?: boolean;
}) {
  const opts = [
    { child: false, label: "For me", Icon: UserIcon },
    { child: true, label: "For my child", Icon: UsersIcon },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Who's this for?"
      className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {opts.map(({ child, label, Icon }) => {
        const on = child === forChild;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(child)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-[9px] text-sm font-bold transition-colors duration-180 ease-out",
              on ? "bg-orange text-white" : "text-white/60 hover:text-white",
            )}>
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
