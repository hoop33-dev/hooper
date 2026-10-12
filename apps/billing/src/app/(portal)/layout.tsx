import { Shell } from "@/src/components/shell/Shell";
import { fullName, initials } from "@/src/lib/format";
import { outstanding } from "@/src/lib/overview";
import { getMyPurchases } from "@/src/services/billing.service";
import { getMyProfile } from "@/src/services/profile.service";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, purchases] = await Promise.all([
    getMyProfile(),
    getMyPurchases(),
  ]);
  if (!profile.ok) redirect("/start");
  const alerts = purchases.ok
    ? outstanding(purchases.data, profile.data.id).length
    : 0;
  const { firstName, lastName, username } = profile.data;

  return (
    <Shell
      alerts={alerts}
      user={{
        name: fullName(firstName, lastName) || username || "Your account",
        initials: initials(firstName, lastName),
        label: username ? `@${username}` : "Account holder",
      }}>
      {children}
    </Shell>
  );
}
