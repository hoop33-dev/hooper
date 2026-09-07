/**
 * Dev-only: renders ProgramExportDocument with a synthetic program to a
 * standalone HTML file so the print layout can be eyeballed without auth.
 *   npx tsx scripts/preview-program-export.tsx > /tmp/preview.html
 *
 * `program` and `styles` are also exported so other dev scripts can reuse the
 * fixture (e.g. the fillable-form-field pipeline check).
 */
import type {
  ExerciseStyleRow,
  ExerciseWithDetails,
  ProgramWithSessions,
} from "@hooper/db";
import { renderProgramExportHtml } from "../src/lib/renderProgramExportHtml";

function ex(
  id: string,
  name: string,
  extra: Partial<ExerciseWithDetails> = {},
): ExerciseWithDetails {
  return {
    id,
    name,
    description: null,
    video_url: null,
    video_source: null,
    video_orientation: null,
    video_thumbnail_url: null,
    parent_id: null,
    default_style_id: null,
    created_by: "c",
    created_at: "",
    updated_at: "",
    categories: [],
    unitTypes: ["Reps", "Weight"],
    unitTypeIds: [],
    defaultStyle: null,
    variants: [],
    ...extra,
  };
}

export const styles: ExerciseStyleRow[] = [
  ["st-wu", "Warmup"],
  ["st-wo", "Working"],
  ["st-top", "Top set"],
].map(([id, name], i) => ({
  id,
  name,
  description: null,
  position: i,
  created_by: "c",
  created_at: "",
  updated_at: "",
}));

function m(
  beId: string,
  set_index: number,
  position: number,
  unit_type: string,
  value: number | null,
  value_unit: string | null = null,
  value_entered_by: "coach" | "athlete" = "coach",
) {
  return {
    block_exercise_id: beId,
    position,
    set_index,
    unit_type,
    value,
    value_entered_by,
    value_unit,
    created_at: "",
    updated_at: "",
  };
}

export const program: ProgramWithSessions = {
  id: "prog-1",
  name: "Off-Season Athletic Base",
  description: null,
  notes:
    "Week 1 is a ramp-up. Hold tempo on every squat, keep the hinge clean, and log every set as you go.",
  weeks: 2,
  status: "active",
  created_by: "c",
  form_id: null,
  created_at: "",
  updated_at: "",
  updatedByName: null,
  sessions: [
    {
      id: "s1",
      program_id: "prog-1",
      week_number: 1,
      name: "Lower Body Strength",
      position: 0,
      link_group_id: null,
      created_at: "",
      updated_at: "",
      blocks: [
        {
          id: "b1",
          session_id: "s1",
          name: "Primary Strength",
          color: "#000",
          position: 0,
          link_group_id: null,
          is_superset: false,
          sets: null,
          created_at: "",
          updated_at: "",
          exercises: [
            {
              id: "be1",
              block_id: "b1",
              exercise_id: "ex-sq",
              position: 0,
              sets: 4,
              notes: "Tempo 3-1-1. Chest up.",
              link_group_id: null,
              style_id: "st-wo",
              created_at: "",
              updated_at: "",
              exercise: ex("ex-sq", "Back Squat", {
                video_url: "https://www.youtube.com/watch?v=1oed-UmAxFs",
                video_source: "link",
              }),
              measurements: [
                m("be1", 0, 0, "Reps", 5),
                m("be1", 0, 1, "Weight", 50, "kg"),
                m("be1", 1, 0, "Reps", 5),
                m("be1", 1, 1, "Weight", 65, "kg"),
                m("be1", 2, 0, "Reps", 5),
                m("be1", 2, 1, "Weight", 70, "kg"),
                m("be1", 3, 0, "Reps", 5),
                m("be1", 3, 1, "Weight", 70, "kg"),
              ],
              setVariants: {},
              setStyles: { 0: styles[0]!, 3: styles[2]! },
            },
          ],
        },
        {
          id: "b2",
          session_id: "s1",
          name: "Superset",
          color: "#000",
          position: 1,
          link_group_id: null,
          is_superset: true,
          sets: 3,
          created_at: "",
          updated_at: "",
          exercises: [
            {
              id: "be2",
              block_id: "b2",
              exercise_id: "ex-nc",
              position: 0,
              sets: 3,
              notes: null,
              link_group_id: null,
              style_id: null,
              created_at: "",
              updated_at: "",
              exercise: ex("ex-nc", "Nordic Curl", { unitTypes: ["Reps"] }),
              measurements: [
                m("be2", 0, 0, "Reps", 5),
                m("be2", 1, 0, "Reps", 5),
                m("be2", 2, 0, "Reps", 5),
              ],
              setVariants: {},
              setStyles: {},
            },
            {
              id: "be3",
              block_id: "b2",
              exercise_id: "ex-cp",
              position: 1,
              sets: 3,
              notes: "Each side.",
              link_group_id: null,
              style_id: null,
              created_at: "",
              updated_at: "",
              exercise: ex("ex-cp", "Copenhagen Plank", {
                unitTypes: ["Time"],
              }),
              measurements: [
                m("be3", 0, 0, "Time", 20, "sec"),
                m("be3", 1, 0, "Time", 20, "sec"),
                m("be3", 2, 0, "Time", 20, "sec"),
              ],
              setVariants: {},
              setStyles: {},
            },
          ],
        },
      ],
    },
    {
      id: "s2",
      program_id: "prog-1",
      week_number: 1,
      name: "Conditioning",
      position: 1,
      link_group_id: null,
      created_at: "",
      updated_at: "",
      blocks: [
        {
          id: "b3",
          session_id: "s2",
          name: "Sprints",
          color: "#000",
          position: 0,
          link_group_id: null,
          is_superset: false,
          sets: null,
          created_at: "",
          updated_at: "",
          exercises: [
            {
              id: "be4",
              block_id: "b3",
              exercise_id: "ex-sp",
              position: 0,
              sets: 6,
              notes: "Walk-back recovery.",
              link_group_id: null,
              style_id: null,
              created_at: "",
              updated_at: "",
              exercise: ex("ex-sp", "Sprint 10m", {
                unitTypes: ["Distance", "Time"],
              }),
              measurements: [
                m("be4", 0, 0, "Distance", 10, "m"),
                m("be4", 0, 1, "Time", null, "sec", "athlete"),
                m("be4", 1, 0, "Distance", 10, "m"),
                m("be4", 1, 1, "Time", null, "sec", "athlete"),
              ],
              setVariants: {},
              setStyles: {},
            },
          ],
        },
      ],
    },
    {
      id: "s3",
      program_id: "prog-1",
      week_number: 2,
      name: "Upper Body Power",
      position: 0,
      link_group_id: null,
      created_at: "",
      updated_at: "",
      blocks: [],
    },
  ],
};

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(
    renderProgramExportHtml({
      program,
      styles,
      coach: "Marcus Davis",
      athlete: "Jordan Lee",
      notes: program.notes ?? "",
      weeks: Array.from({ length: program.weeks }, (_, i) => i + 1),
    }),
  );
}
