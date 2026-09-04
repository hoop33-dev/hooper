---
name: router-refresh-modal-gap
description: Closing a portal modal immediately then calling router.refresh() leaves a visible gap where the mutation looks like it did nothing.
metadata:
  type: feedback
---

In apps/web portal, several mutation flows do `closeModal(); router.refresh(); selectSomething()` — but `router.refresh()` is a server round-trip, so props (e.g. `program.weeks`) don't update for ~1s. During that window the modal is gone but the new item (week tab, etc.) hasn't rendered, reading as "nothing happened."

**Why:** user flagged this for the "+ Week" add-week modal specifically.

**How to apply:** two patterns exist for closing the gap:

1. **Hold the modal** on its saving state until refreshed props reflect the change — `useWeekAddCompletion` in `useProgramCanvasState.ts` (records the count at submit, watches for the prop to exceed it, 8s safety timeout). Use when there's no local list to patch.

2. **Optimistic list** (preferred — user wants the app to feel fast): patch a local mirror of the server list immediately, `router.refresh()` in the background, roll back on failure. Shared hook `useOptimisticList` in `components/portal/ui/` (mirrors the older `useProgramAttachments`). Also `useProgramAssignments` (athletes/) and `useTeamMembers`, `useQuestionMutations` wrap it per-feature.

**Applied (as of 2026-09-02):** FormsListShell, ProgramsListShell (via `useProgramListActions`), TeamsListShell, BlockLibraryListShell, ProgramDetailActions (drawer only — page `<PageHeader>` is an RSC, catches up on refresh), useFormEditorState questions, useProgramCanvasState session **create + rename + delete** (`optimisticSession` synthesizes the ghost row; copy/template modes show "New session…" for ~1s), AthleteDetailShell + TeamDetailShell assign/members + team header rename.

**Deliberately left on bare refresh:** session **duplicate** (`setLinkedWeeksAction` fans out across many weeks — hard to model); `ExerciseLibraryShell`/`CreateExerciseButton` already mitigate with `useTransition` + a "Refreshing…" strip.
