import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalLayout } from "@/src/components/portal/PortalLayout";
import { getCoachProfile } from "@/src/services/auth.service";

export default async function PortalRootLayout({ children }: { children: ReactNode }) {
  const result = await getCoachProfile();

  if (!result.ok) {
    redirect("/not-authorized");
  }

  return <PortalLayout profile={result.data}>{children}</PortalLayout>;
}
