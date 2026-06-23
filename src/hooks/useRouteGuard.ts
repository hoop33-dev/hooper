import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/src/stores/auth.store";
import type { RoleType } from "@/src/types/database.types";

type AppRouter = ReturnType<typeof useRouter>;

const SHARED_ROUTES = new Set([
  "chat",
  "settings",
  "parent",
  "profile-settings",
  "security",
  "security-verify",
  "security-new-password",
]);

function toRolePath(role: RoleType) {
  return `/(app)/${role}` as `/(app)/${RoleType}`;
}

function guardUnauthenticated(
  router: AppRouter,
  inRoot: boolean,
  inAuth: boolean,
) {
  if (!inRoot && !inAuth) {
    router.replace("/");
  }
}

function guardNeedsVerification(router: AppRouter, inVerify: boolean) {
  if (!inVerify) {
    router.replace("/(auth)/verify-email");
  }
}

function guardAuthenticated(
  router: AppRouter,
  segments: string[],
  role: RoleType,
  inResetPassword: boolean,
  inRoot: boolean,
  inAuth: boolean,
  inApp: boolean,
) {
  if (inResetPassword) return;
  if (inRoot || inAuth) { router.replace(toRolePath(role)); return; }
  if (inApp && segments[1] !== role && !SHARED_ROUTES.has(segments[1])) {
    router.replace(toRolePath(role));
  }
}

export function useRouteGuard() {
  const { status, primaryRole, session } = useAuthStore();
  const router = useRouter();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (status === "loading") return;

    const inAuth = segments[0] === "(auth)";
    const inApp = segments[0] === "(app)";
    const inRoot = !inAuth && !inApp;
    const inVerify = inAuth && segments[1] === "verify-email";
    const inResetPassword = inAuth && segments[1] === "reset-password";

    if (status === "unauthenticated") {
      guardUnauthenticated(router, inRoot, inAuth);
      return;
    }
    if (status === "needs_verification") {
      guardNeedsVerification(router, inVerify);
      return;
    }
    if (status === "authenticated") {
      // Fall back to session user_metadata when profile hasn't loaded yet.
      const role =
        primaryRole ??
        (session?.user?.user_metadata?.role as RoleType | undefined) ??
        null;
      if (role) {
        guardAuthenticated(router, segments, role, inResetPassword, inRoot, inAuth, inApp);
      }
    }
  }, [status, segments, primaryRole, session, router]);
}
