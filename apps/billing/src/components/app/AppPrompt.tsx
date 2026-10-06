import { APP_LINK } from "@/src/components/app/AppLinks";
import { ArrowIcon, SmartphoneIcon } from "@/src/components/icons";
import type { ReactNode } from "react";

/** Dark "this lives in the app" card (design `AppPrompt`). */
export function AppPrompt({
  title,
  body,
  cta = "Open app",
  icon,
}: {
  title: string;
  body: string;
  cta?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-ink-soft flex items-center gap-3.5 rounded-xl border border-white/[0.08] px-[18px] py-3.5">
      <div className="bg-orange/15 text-orange flex size-9 shrink-0 items-center justify-center rounded-[9px]">
        {icon ?? <SmartphoneIcon size={17} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-white">{title}</div>
        <div className="text-[12.5px] leading-[1.45] text-white/55">{body}</div>
      </div>
      <a
        href={APP_LINK}
        target="_blank"
        rel="noreferrer"
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-3.5 text-[12.5px] font-semibold text-white">
        {cta}
        <ArrowIcon size={13} className="text-orange" />
      </a>
    </div>
  );
}
