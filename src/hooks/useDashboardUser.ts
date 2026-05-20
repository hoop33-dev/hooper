import { useEffect, useState } from "react";

import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/stores/auth.store";
import type { RoleId } from "@/src/constants/roles";

export type DashboardUser = {
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  initials: string;
  role: RoleId;
  regionName: string | null;
};

function initialsOf(first: string, last: string): string {
  const a = first.trim().charAt(0).toUpperCase();
  const b = last.trim().charAt(0).toUpperCase();
  return `${a}${b}` || "?";
}

export function useDashboardUser(): DashboardUser | null {
  const { profile, primaryRole, session } = useAuthStore();
  const [regionName, setRegionName] = useState<string | null>(null);

  const regionId = profile?.region_id ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!regionId) {
      setRegionName(null);
      return;
    }
    supabase
      .from("regions")
      .select("name")
      .eq("id", regionId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRegionName(data?.name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  // Prefer profile; fall back to session metadata so the header renders
  // immediately on first load.
  const meta = session?.user?.user_metadata ?? {};
  const firstName =
    profile?.first_name ?? (meta.first_name as string | undefined) ?? "";
  const lastName =
    profile?.last_name ?? (meta.last_name as string | undefined) ?? "";
  const username =
    profile?.username ?? (meta.username as string | undefined) ?? "";
  const role = primaryRole ?? (meta.role as RoleId | undefined) ?? null;

  if (!role || !firstName) return null;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    username,
    initials: initialsOf(firstName, lastName),
    role,
    regionName,
  };
}
