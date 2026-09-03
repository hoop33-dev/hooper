"use client";

import type { ReactNode } from "react";
import { PageHeader, type Breadcrumb } from "../ui/PageHeader";
import { useProgramHeaderCollapse } from "./ProgramHeaderCollapseContext";

interface ProgramCanvasHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

/** Thin client wrapper so the server page's <PageHeader> can hide its middle
 * band in response to the collapse state that lives in
 * <ProgramHeaderCollapseProvider> (toggled from the WeekTabStrip / Shift+E). */
export function ProgramCanvasHeader(props: ProgramCanvasHeaderProps) {
  const { headerCollapsed } = useProgramHeaderCollapse();
  return <PageHeader {...props} hideMiddle={headerCollapsed} />;
}
