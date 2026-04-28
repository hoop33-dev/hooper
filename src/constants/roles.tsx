import type { ComponentType } from "react";
import {
  PlayerIcon,
  ParentIcon,
  CoachIcon,
} from "@/src/components/auth/RoleIcons";

export type RoleId = "player" | "parent" | "coach";

export type RoleConfig = {
  id: RoleId;
  label: string;
  title: string;
  body: string;
  cta: string;
  Icon: ComponentType;
  accent: string;
  accentDim: string;
  accentBorder: string;
};

export const ROLES: RoleConfig[] = [
  {
    id: "player",
    label: "Athlete",
    title: "Player",
    body: "Get your program, log every session, and track your progress.",
    cta: "Sign up as a player",
    Icon: PlayerIcon,
    accent: "#F15825",
    accentDim: "rgba(241,88,37,0.12)",
    accentBorder: "rgba(241,88,37,0.3)",
  },
  {
    id: "parent",
    label: "Guardian",
    title: "Parent",
    body: "Stay across your athlete's training and see their progress.",
    cta: "Sign up as a parent",
    Icon: ParentIcon,
    accent: "#F68D68",
    accentDim: "rgba(246,141,104,0.10)",
    accentBorder: "rgba(246,141,104,0.25)",
  },
  {
    id: "coach",
    label: "Coaching Staff",
    title: "Coach",
    body: "Build programs, assign workouts, and follow your team's load.",
    cta: "Sign up as a coach",
    Icon: CoachIcon,
    accent: "#4A7FD4",
    accentDim: "rgba(74,127,212,0.12)",
    accentBorder: "rgba(74,127,212,0.3)",
  },
];
