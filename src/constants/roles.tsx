import type { ReactNode } from "react";
import {
  PlayerIcon,
  ParentIcon,
  CoachIcon,
} from "@/src/components/auth/RoleIcons";

export type RoleId = "player" | "parent" | "coach";

export type RoleConfig = {
  id: RoleId;
  label: string;
  /** Short, single-word role name shown on badges (e.g. the settings chip). */
  shortLabel: string;
  title: string;
  body: string;
  cta: string;
  icon: ReactNode;
  accent: string;
  accentDim: string;
  accentBorder: string;
  headerTint: string;
  planName: string;
  planSub: string;
};

export const ROLES: RoleConfig[] = [
  {
    id: "player",
    label: "Athlete",
    shortLabel: "Athlete",
    title: "Player",
    body: "Get your program, log every session, and track your progress.",
    cta: "Sign up as a player",
    icon: <PlayerIcon />,
    accent: "#F15825",
    accentDim: "rgba(241,88,37,0.12)",
    accentBorder: "rgba(241,88,37,0.3)",
    headerTint: "rgba(241,88,37,0.06)",
    planName: "Level 1",
    planSub: "Standard access · No coach",
  },
  {
    id: "parent",
    label: "Guardian",
    shortLabel: "Parent",
    title: "Parent",
    body: "Stay across your athlete's training and see their progress.",
    cta: "Sign up as a parent",
    icon: <ParentIcon />,
    accent: "#F68D68",
    accentDim: "rgba(246,141,104,0.10)",
    accentBorder: "rgba(246,141,104,0.25)",
    headerTint: "rgba(246,141,104,0.06)",
    planName: "Level 2",
    planSub: "With coach access",
  },
  {
    id: "coach",
    label: "Coaching Staff",
    shortLabel: "Coach",
    title: "Coach",
    body: "Build programs, assign workouts, and follow your team's load.",
    cta: "Sign up as a coach",
    icon: <CoachIcon />,
    accent: "#4A7FD4",
    accentDim: "rgba(74,127,212,0.12)",
    accentBorder: "rgba(74,127,212,0.3)",
    headerTint: "rgba(0,32,92,0.35)",
    planName: "Coach plan",
    planSub: "Manage up to 30 athletes",
  },
];

export function roleConfig(id: RoleId | null | undefined): RoleConfig {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}
