import { getProgramForm, submitPreSessionForm } from "@/src/services/formResponse.service";
import { initClient } from "@hooper/api";

const mockSupabase = { from: jest.fn() };
const mockFrom = mockSupabase.from;

beforeEach(() => {
  jest.clearAllMocks();
  initClient(mockSupabase as any);
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/** `.select(...).eq(...).single()` */
function makeSingleEqBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
}

/** `.select(...).eq(...).eq(...).eq(...).maybeSingle()` (startOrResumeSession lookup) */
function makeInProgressLookupBuilder(resolveValue: unknown) {
  const maybeSingle = jest.fn().mockResolvedValue(resolveValue);
  const eq3 = jest.fn().mockReturnValue({ maybeSingle });
  const eq2 = jest.fn().mockReturnValue({ eq: eq3 });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  return { select };
}

/** `.insert(...).select().single()` */
function makeInsertSingleBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  return { insert };
}

/** `.update(...).eq(...).select().single()` */
function makeUpdateSingleBuilder(resolveValue: unknown) {
  const single = jest.fn().mockResolvedValue(resolveValue);
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const update = jest.fn().mockReturnValue({ eq });
  return { update };
}

// ─── getProgramForm ─────────────────────────────────────────────────────────

describe("getProgramForm", () => {
  it("returns null when the program has no form attached", async () => {
    mockFrom.mockReturnValue(makeSingleEqBuilder({ data: { form_id: null }, error: null }));

    const result = await getProgramForm("prog1");

    expect(result).toBeNull();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("fetches and shapes the form with sorted questions and options when attached", async () => {
    const programBuilder = makeSingleEqBuilder({ data: { form_id: "form1" }, error: null });
    const formBuilder = makeSingleEqBuilder({
      data: {
        id: "form1",
        name: "Check-in",
        form_questions: [
          {
            id: "q2",
            position: 1,
            prompt: "Second",
            form_question_options: [],
          },
          {
            id: "q1",
            position: 0,
            prompt: "First",
            form_question_options: [
              { question_id: "q1", position: 1, label: "B" },
              { question_id: "q1", position: 0, label: "A" },
            ],
          },
        ],
      },
      error: null,
    });
    mockFrom.mockReturnValueOnce(programBuilder).mockReturnValueOnce(formBuilder);

    const result = await getProgramForm("prog1");

    expect(result?.questions.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(result?.questions[0].options.map((o) => o.label)).toEqual(["A", "B"]);
  });
});

// ─── submitPreSessionForm ───────────────────────────────────────────────────

describe("submitPreSessionForm", () => {
  it("creates a session, records the response, and links it back", async () => {
    const startLookup = makeInProgressLookupBuilder({ data: null, error: null });
    const startInsert = makeInsertSingleBuilder({
      data: { id: "sc1", pre_form_response_id: null },
      error: null,
    });
    const responseInsert = makeInsertSingleBuilder({ data: { id: "resp1" }, error: null });
    const completionUpdate = makeUpdateSingleBuilder({
      data: { id: "sc1", pre_form_response_id: "resp1" },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(startLookup)
      .mockReturnValueOnce(startInsert)
      .mockReturnValueOnce(responseInsert)
      .mockReturnValueOnce(completionUpdate);

    const result = await submitPreSessionForm("s1", "p1", "form1", { q1: "yes" });

    expect(responseInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ form_id: "form1", athlete_profile_id: "p1", session_completion_id: "sc1" }),
    );
    expect(completionUpdate.update).toHaveBeenCalledWith({ pre_form_response_id: "resp1" });
    expect(result.pre_form_response_id).toBe("resp1");
  });

  it("is idempotent: returns the existing completion without re-recording when already submitted", async () => {
    const startLookup = makeInProgressLookupBuilder({
      data: { id: "sc1", pre_form_response_id: "resp1" },
      error: null,
    });
    mockFrom.mockReturnValueOnce(startLookup);

    const result = await submitPreSessionForm("s1", "p1", "form1", { q1: "yes" });

    expect(result.pre_form_response_id).toBe("resp1");
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});
