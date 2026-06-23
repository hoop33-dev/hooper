import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/src/stores/auth.store";
import type { RoleType } from "@/src/types/database.types";

const SHARED_ROUTES = new Set([
  "chat",
  "settings",
  "parent",
  "profile-settings",
  "security",
  "security-verify",
  "security-new-password",
]);

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
      if (!inRoot && !inAuth) {
        router.replace("/");
      }
      return;
    }

    if (status === "needs_verification") {
      if (!inVerify) {
        router.replace("/(auth)/verify-email");
      }
      return;
    }

    if (status === "authenticated") {
      if (inResetPassword) return;

      // Fall back to session user_metadata when profile hasn't loaded yet.
      // This prevents defaulting to "player" while primaryRole is still null.
      const role =
        primaryRole ??
        (session?.user?.user_metadata?.role as RoleType | undefined) ??
        null;

      // Don't redirect until we know the role — avoids landing on the wrong dashboard.
      if (!role) return;

      if (inRoot || inAuth) {
        router.replace(`/(app)/${role}` as `/(app)/${typeof role}`);
        return;
      }
      // Prevent a user from staying on another role's dashboard.
      // Shared screens (chat, settings) and parent-only nested routes are allowed.
      if (inApp && segments[1] !== role && !SHARED_ROUTES.has(segments[1])) {
        router.replace(`/(app)/${role}` as `/(app)/${typeof role}`);
      }
    }
  }, [status, segments, primaryRole, session]);
}
