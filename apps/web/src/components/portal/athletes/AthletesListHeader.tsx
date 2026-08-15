"use client";

import { usePathname } from "next/navigation";
import { PageHeader } from "../ui/PageHeader";
import { AthletesTabs } from "./AthletesTabs";

/** Lives in athletes/layout.tsx so it persists across /athletes <-> /athletes/teams
 * navigation instead of remounting into a skeleton on every tab switch. Renders
 * nothing on detail routes (/athletes/[id], /athletes/teams/[id]), which draw
 * their own header inside their shells. */
export function AthletesListHeader() {
  const pathname = usePathname();

  if (pathname === "/athletes") {
    return (
      <PageHeader
        title="Athletes"
        subtitle="Browse athletes and manage their program assignments"
        action={<AthletesTabs />}
      />
    );
  }

  if (pathname === "/athletes/teams") {
    return (
      <PageHeader
        title="Teams"
        subtitle="Group athletes into teams and assign programs together"
        action={<AthletesTabs />}
      />
    );
  }

  return null;
}
