import { cn } from "@/src/lib/cn";

interface PortalBadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "neutral" | "green" | "blue";
  className?: string;
}

const variants = {
  orange: "bg-portal-orange-soft text-portal-orange",
  neutral: "bg-portal-border text-portal-text2",
  green: "bg-green-50 text-green-700",
  blue: "bg-blue-50 text-blue-700",
};

export function PortalBadge({ children, variant = "neutral", className }: PortalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
