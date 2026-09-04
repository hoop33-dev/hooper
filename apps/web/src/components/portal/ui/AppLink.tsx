"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { useReportNavPending } from "./NavProgress";

/**
 * `next/link` with its pending state wired into the global `<TopProgressBar />`.
 *
 * `useLinkStatus()` only works inside a `<Link>`, so the bridge lives in a
 * zero-DOM child component rather than here.
 */
function LinkStatusReporter() {
  const { pending } = useLinkStatus();
  useReportNavPending(pending);
  return null;
}

export function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkStatusReporter />
    </Link>
  );
}
