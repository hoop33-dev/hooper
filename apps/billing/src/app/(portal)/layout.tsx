import { Shell } from "@/src/components/shell/Shell";
import { fullName, initials } from "@/src/lib/format";
import { getMyProfile } from "@/src/services/profile.service";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getMyProfile();
  if (!profile.ok) redirect("/start");
  const { firstName, lastName, username } = profile.data;

  return (
    <Shell
      user={{
        name: fullName(firstName, lastName) || username || "Your account",
        initials: initials(firstName, lastName),
        label: username ? `@${username}` : "Account holder",
      }}>
      {children}
    </Shell>
  );
}
