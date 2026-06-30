"use client";

import type { ReactNode } from "react";
import type { CoachProfile } from "@/src/services/auth.service";
import { PortalSidebar } from "./PortalSidebar";

interface PortalLayoutProps {
  profile: CoachProfile | null;
  children: ReactNode;
}

export function PortalLayout({ profile, children }: PortalLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar profile={profile} />
      <main className="flex flex-1 flex-col overflow-hidden bg-portal-bg text-portal-text1">
        {children}
      </main>
    </div>
  );
}
