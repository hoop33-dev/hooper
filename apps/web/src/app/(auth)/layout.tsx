import type { ReactNode } from "react";
import { AuthBrandPanel } from "./AuthBrandPanel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <main className="bg-auth-canvas flex flex-1 items-center justify-center p-10">
        {children}
      </main>
    </div>
  );
}
