import { AppLink } from "@/src/components/portal/ui/AppLink";
import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  href?: string;
  comingSoon?: boolean;
}

function StatCardContent({
  label,
  value,
  icon,
  comingSoon,
}: Omit<StatCardProps, "href">) {
  return (
    <>
      <div className="bg-portal-orange-soft text-portal-orange flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-portal-text1 font-title text-2xl font-extrabold">
          {value}
        </div>
        <div className="text-portal-text3 text-xs font-semibold tracking-wide uppercase">
          {label}
          {comingSoon && " · Coming soon"}
        </div>
      </div>
    </>
  );
}

export function StatCard({
  label,
  value,
  icon,
  href,
  comingSoon,
}: StatCardProps) {
  const base =
    "border-portal-border bg-portal-card flex items-center gap-3.5 rounded-xl border p-4";

  if (comingSoon || !href) {
    return (
      <div className={cn(base, comingSoon && "opacity-50")}>
        <StatCardContent
          label={label}
          value={value}
          icon={icon}
          comingSoon={comingSoon}
        />
      </div>
    );
  }

  return (
    <AppLink
      href={href}
      className={cn(base, "hover:bg-portal-bg transition-colors")}>
      <StatCardContent label={label} value={value} icon={icon} />
    </AppLink>
  );
}
