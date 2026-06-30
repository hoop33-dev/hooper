/**
 * Re-exports the shared database types from `@hooper/db` so both the web and
 * mobile apps consume a single source of truth for the Supabase schema.
 *
 * The authoritative types are generated once, into `packages/db/src/schema.ts`.
 * Never hand-edit them here.
 */
export * from "@hooper/db";

// Exercise Library types (re-exported from @hooper/db)
export type {
  ExerciseCategoryRow,
  ExerciseRow,
  ExerciseCategoryLinkRow,
  ExerciseUnitTypeRow,
  ExerciseCategoryWithCount,
  ExerciseCategoryTreeNode,
  ExerciseWithDetails,
} from "@hooper/db";
