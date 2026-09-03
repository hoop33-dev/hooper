import type {
  ExerciseStyleRow,
  ExerciseWithDetails,
  ProgramWithSessions,
} from "@hooper/db";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProgramExportDocument } from "./ProgramExportDocument";

function exercise(
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

const working: ExerciseStyleRow = {
  id: "st-working",
  name: "Working",
  description: null,
  position: 1,
  created_by: "c",
  created_at: "",
  updated_at: "",
};

const program: ProgramWithSessions = {
  id: "prog-1",
  name: "Off-Season Athletic Base",
  description: null,
  notes: "Hold tempo on every squat.",
  weeks: 2,
  status: "active",
  created_by: "c",
  form_id: null,
  created_at: "",
  updated_at: "",
  updatedByName: null,
  sessions: [
    {
      id: "sess-1",
      program_id: "prog-1",
      week_number: 1,
      name: "Lower Body Strength",
      position: 0,
      link_group_id: null,
      created_at: "",
      updated_at: "",
      blocks: [
        {
          id: "blk-1",
          session_id: "sess-1",
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
              id: "be-1",
              block_id: "blk-1",
              exercise_id: "ex-squat",
              position: 0,
              sets: 2,
              notes: "Knees over toes.",
              link_group_id: null,
              style_id: "st-working",
              created_at: "",
              updated_at: "",
              exercise: exercise("ex-squat", "Back Squat", {
                video_url: "https://youtu.be/abc123",
                video_source: "link",
              }),
              measurements: [
                {
                  block_exercise_id: "be-1",
                  position: 0,
                  set_index: 0,
                  unit_type: "Reps",
                  value: 5,
                  value_entered_by: "coach",
                  value_unit: null,
                  created_at: "",
                  updated_at: "",
                },
                {
                  block_exercise_id: "be-1",
                  position: 1,
                  set_index: 0,
                  unit_type: "Weight",
                  value: 80,
                  value_entered_by: "coach",
                  value_unit: "kg",
                  created_at: "",
                  updated_at: "",
                },
              ],
              setVariants: {},
              setStyles: {},
            },
          ],
        },
        {
          id: "blk-2",
          session_id: "sess-1",
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
              id: "be-2",
              block_id: "blk-2",
              exercise_id: "ex-nordic",
              position: 0,
              sets: 3,
              notes: null,
              link_group_id: null,
              style_id: null,
              created_at: "",
              updated_at: "",
              exercise: exercise("ex-nordic", "Nordic Curl", {
                unitTypes: ["Reps"],
              }),
              measurements: [],
              setVariants: {},
              setStyles: {},
            },
          ],
        },
      ],
    },
    {
      id: "sess-2",
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

describe("ProgramExportDocument", () => {
  const html = renderToStaticMarkup(
    <ProgramExportDocument
      program={program}
      styles={[working]}
      coach="Marcus Davis"
      athlete="Jordan Lee"
      notes="Week 1 is a ramp-up."
      weeks={[1, 2]}
    />,
  );

  it("renders the cover with coach, athlete and notes", () => {
    expect(html).toContain("Off-Season Athletic Base");
    expect(html).toContain("Marcus Davis");
    expect(html).toContain("Jordan Lee");
    expect(html).toContain("Week 1 is a ramp-up.");
  });

  it("puts the athlete name in the running header", () => {
    expect(html).toContain('class="rhs">Jordan Lee<');
  });

  it("renders a schedule table per week", () => {
    expect(html).toContain("Week 1 schedule");
    expect(html).toContain("Week 2 schedule");
  });

  it("renders sessions, blocks, and set values", () => {
    expect(html).toContain("Lower Body Strength");
    expect(html).toContain("Primary Strength");
    expect(html).toContain("80 kg");
    expect(html).toContain("Knees over toes.");
  });

  it("letters superset exercises and describes the rounds", () => {
    expect(html).toContain("3 rounds · complete A back to back");
    expect(html).toContain(">A<");
  });

  it("links the demo video and marks the first session of each week as a page break", () => {
    expect(html).toContain("https://youtu.be/abc123");
    expect(html).toContain("session weekstart");
  });

  it("full-program export shows no week-coverage label", () => {
    expect(html).toContain("2 weeks · 2 sessions");
    expect(html).not.toContain(" of 2");
  });
});

describe("ProgramExportDocument — fillable-field markers", () => {
  const html = renderToStaticMarkup(
    <ProgramExportDocument
      program={program}
      styles={[working]}
      coach="Marcus Davis"
      athlete="Jordan Lee"
      notes=""
      weeks={[1, 2]}
    />,
  );

  it("emits one Date marker per session, scoped to week + position", () => {
    // sessions: week 1 / position 0, and week 2 / position 0
    expect(html).toContain("HFF__date_w01_s00__X");
    expect(html).toContain("HFF__date_w02_s00__X");
    expect((html.match(/HFF__date_/g) ?? []).length).toBe(2);
  });

  it("brackets every Logged cell with an L and an R marker", () => {
    // be-1 has 2 sets in week-1 session-0 block-0 exercise-0
    expect(html).toContain("HFF__log_w01_s00_b00_e00_set00__L");
    expect(html).toContain("HFF__log_w01_s00_b00_e00_set00__R");
    expect(html).toContain("HFF__log_w01_s00_b00_e00_set01__R");
    const ls = (html.match(/HFF__log_[a-z0-9_]+__L/g) ?? []).length;
    const rs = (html.match(/HFF__log_[a-z0-9_]+__R/g) ?? []).length;
    expect(ls).toBeGreaterThan(0);
    expect(ls).toBe(rs);
  });
});

describe("ProgramExportDocument — per-set exercise variants", () => {
  const withVariant: ProgramWithSessions = {
    ...program,
    sessions: [
      {
        ...program.sessions[0]!,
        blocks: [
          {
            ...program.sessions[0]!.blocks[0]!,
            exercises: [
              {
                ...program.sessions[0]!.blocks[0]!.exercises[0]!,
                sets: 2,
                setVariants: { 1: exercise("ex-tempo", "Tempo Back Squat") },
              },
            ],
          },
        ],
      },
      program.sessions[1]!,
    ],
  };

  const html = renderToStaticMarkup(
    <ProgramExportDocument
      program={withVariant}
      styles={[working]}
      coach="Marcus Davis"
      athlete="Jordan Lee"
      notes=""
      weeks={[1, 2]}
    />,
  );

  it("adds an EXERCISE column naming each set's effective variant", () => {
    expect(html).toContain(">Exercise<");
    expect(html).toContain("Tempo Back Squat");
  });
});

describe("ProgramExportDocument — week subset", () => {
  const html = renderToStaticMarkup(
    <ProgramExportDocument
      program={program}
      styles={[working]}
      coach="Marcus Davis"
      athlete="Jordan Lee"
      notes=""
      weeks={[1]}
    />,
  );

  it("only renders the selected week's schedule and sessions", () => {
    expect(html).toContain("Week 1 schedule");
    expect(html).not.toContain("Week 2 schedule");
    expect(html).toContain("Lower Body Strength");
    expect(html).not.toContain("Upper Body Power");
  });

  it("labels the coverage and counts only exported sessions", () => {
    expect(html).toContain("Week 1 of 2");
    expect(html).toContain("in export");
  });
});
