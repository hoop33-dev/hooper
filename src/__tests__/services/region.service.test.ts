import { supabase } from "@/src/lib/supabase";
import { listRegionOptions } from "@/src/services/region.service";

jest.mock("@/src/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

// Builds the from("regions").select(...).order(...) chain, where order resolves
// to the Supabase { data, error } envelope.
function mockRegionsQuery(result: { data: unknown; error: unknown }) {
  const order = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ order });
  mockFrom.mockReturnValue({ select });
  return { select, order };
}

beforeEach(() => jest.clearAllMocks());

describe("listRegionOptions", () => {
  it("maps rows to { value, label } sorted by name", async () => {
    mockRegionsQuery({
      data: [
        { id: "r1", name: "Auckland" },
        { id: "r2", name: "Wellington" },
      ],
      error: null,
    });

    const options = await listRegionOptions();

    expect(options).toEqual([
      { value: "r1", label: "Auckland" },
      { value: "r2", label: "Wellington" },
    ]);
  });

  it("queries the regions table ordered by name", async () => {
    const { select, order } = mockRegionsQuery({ data: [], error: null });

    await listRegionOptions();

    expect(mockFrom).toHaveBeenCalledWith("regions");
    expect(select).toHaveBeenCalledWith("id, name");
    expect(order).toHaveBeenCalledWith("name");
  });

  it("returns an empty array on error", async () => {
    mockRegionsQuery({ data: null, error: { message: "boom" } });

    await expect(listRegionOptions()).resolves.toEqual([]);
  });

  it("returns an empty array when data is null", async () => {
    mockRegionsQuery({ data: null, error: null });

    await expect(listRegionOptions()).resolves.toEqual([]);
  });
});
