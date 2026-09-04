import { AppLink } from "@/src/components/portal/ui/AppLink";
import type { ReactNode } from "react";

interface QuickLinkCardProps {
  label: string;
  description: string;
  icon: ReactNode;
  href: string;
}

export function QuickLinkCard({
  label,
  description,
  icon,
  href,
}: QuickLinkCardProps) {
  return (
    <AppLink
      href={href}
      className="border-portal-border bg-portal-card hover:bg-portal-bg flex items-center gap-3.5 rounded-xl border p-4 transition-colors">
      <div className="bg-portal-orange-soft text-portal-orange flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-portal-text1 text-sm font-bold">{label}</div>
        <div className="text-portal-text3 mt-0.5 text-xs">{description}</div>
      </div>
    </AppLink>
  );
}
