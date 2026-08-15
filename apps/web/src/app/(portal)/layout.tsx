import { PortalLayout } from "@/src/components/portal/PortalLayout";
import { PortalSidebar } from "@/src/components/portal/PortalSidebar";
import { getCoachProfile } from "@/src/services/auth.service";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

/**
 * Resolves the coach profile and gates access, wrapped separately from the
 * shell below so the sidebar can paint instantly on every navigation instead
 * of blocking on this every time. Fully unauthenticated users never reach
 * here — middleware already redirects them before Next.js renders anything;
 * this only guards the narrower "authenticated but not a coach" case.
 */
async function PortalGate({ children }: { children: ReactNode }) {
  const result = await getCoachProfile();

  if (!result.ok) {
    redirect("/not-authorized");
  }

  return <PortalLayout profile={result.data}>{children}</PortalLayout>;
}

// Matches PortalLayout's markup so there's no visible shift once PortalGate
// resolves. profile=null renders the sidebar's existing placeholder state
// (PortalSidebar already supports this) instead of blocking the sidebar on
// the auth round trip. The page itself streams in separately via its own
// route-level loading.tsx once PortalGate resolves.
function PortalShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar profile={null} />
      <main className="bg-portal-bg flex min-h-0 flex-1 flex-col overflow-hidden" />
    </div>
  );
}

export default function PortalRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<PortalShellSkeleton />}>
      <PortalGate>{children}</PortalGate>
    </Suspense>
  );
}
