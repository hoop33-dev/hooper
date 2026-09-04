"use client";

import type { CoachProfile } from "@/src/services/auth.service";
import type { ReactNode } from "react";
import { PortalSidebar } from "./PortalSidebar";
import { NavProgressProvider, TopProgressBar } from "./ui/NavProgress";
import { ToastProvider } from "./ui/Toast";

interface PortalLayoutProps {
  profile: CoachProfile | null;
  children: ReactNode;
}

export function PortalLayout({ profile, children }: PortalLayoutProps) {
  return (
    <ToastProvider>
      <NavProgressProvider>
        <TopProgressBar />
        <div className="flex h-screen overflow-hidden">
          <PortalSidebar profile={profile} />
          <main className="bg-portal-bg text-portal-text1 flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </NavProgressProvider>
    </ToastProvider>
  );
}
