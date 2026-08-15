import { AthletesListHeader } from "@/src/components/portal/athletes/AthletesListHeader";
import type { ReactNode } from "react";

export default function AthletesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AthletesListHeader />
      {children}
    </div>
  );
}
