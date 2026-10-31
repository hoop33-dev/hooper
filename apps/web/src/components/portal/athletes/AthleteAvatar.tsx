import { cn } from "@/src/lib/cn";

type NamedProfile = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

export function athleteName(profile: NamedProfile): string {
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username ||
    "Unnamed athlete"
  );
}

/** Round avatar: the profile photo, or the name's initial on orange-soft —
 * the same fallback as the athletes table. */
export function AthleteAvatar({
  profile,
  size = 36,
}: {
  profile: NamedProfile & { avatar_url: string | null };
  size?: number;
}) {
  return (
    <ImageOrInitial
      src={profile.avatar_url}
      label={athleteName(profile)}
      size={size}
      className="rounded-full"
    />
  );
}

/** A team's avatar, or its initial — rounded square to tell it apart from
 * an athlete at a glance. */
export function TeamTile({
  team,
  size = 36,
}: {
  team: { name: string; avatar_url: string | null };
  size?: number;
}) {
  return (
    <ImageOrInitial
      src={team.avatar_url}
      label={team.name}
      size={size}
      className="rounded-lg"
    />
  );
}

function ImageOrInitial({
  src,
  label,
  size,
  className,
}: {
  src: string | null;
  label: string;
  size: number;
  className: string;
}) {
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "bg-portal-orange-soft text-portal-orange flex flex-shrink-0 items-center justify-center overflow-hidden font-extrabold",
        className,
      )}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        label.trim().charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}
