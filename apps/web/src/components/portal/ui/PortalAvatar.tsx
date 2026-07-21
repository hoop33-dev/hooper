import { cn } from "@/src/lib/cn";

interface PortalAvatarProps {
  firstName: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
}

/** A profile photo when one exists, otherwise the same initials-squircle
 * used everywhere else in the portal (programs, teams). Plain <img>, not
 * next/image — avatar_url points at Supabase Storage, an external domain
 * not registered in next.config.ts's image remote patterns. */
export function PortalAvatar({
  firstName,
  avatarUrl,
  size = 36,
  className,
}: PortalAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        style={{ width: size, height: size }}
        className={cn("flex-shrink-0 rounded-lg object-cover", className)}
      />
    );
  }

  const initial = (firstName.trim().charAt(0) || "?").toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "bg-portal-orange-soft text-portal-orange flex flex-shrink-0 items-center justify-center rounded-lg text-sm font-extrabold",
        className,
      )}>
      {initial}
    </div>
  );
}
