import { useDashboardUser } from "@/src/hooks/useDashboardUser";
import { supabase } from "@/src/lib/supabase";
import { useAuthStore } from "@/src/stores/auth.store";
import { renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@/src/stores/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("@/src/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const mockStore = useAuthStore as unknown as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

function mockRegionName(name: string | null) {
  const maybeSingle = jest
    .fn()
    .mockResolvedValue({ data: name ? { name } : null });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ select });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRegionName(null);
});

describe("useDashboardUser", () => {
  it("returns null when there is no role or first name", () => {
    mockStore.mockReturnValue({
      profile: null,
      primaryRole: null,
      session: null,
    });

    const { result } = renderHook(() => useDashboardUser());

    expect(result.current).toBeNull();
  });

  it("builds the dashboard user from the profile", () => {
    mockStore.mockReturnValue({
      profile: {
        first_name: "Alice",
        last_name: "Smith",
        username: "alice",
        region_id: null,
        avatar_url: "https://cdn/a.jpg",
        bio: "Hi",
        is_private: true,
        show_age: false,
      },
      primaryRole: "player",
      session: null,
    });

    const { result } = renderHook(() => useDashboardUser());

    expect(result.current).toMatchObject({
      firstName: "Alice",
      lastName: "Smith",
      fullName: "Alice Smith",
      username: "alice",
      initials: "AS",
      role: "player",
      avatarUrl: "https://cdn/a.jpg",
      isPrivate: true,
      showAge: false,
    });
  });

  it("falls back to session metadata before the profile loads", () => {
    mockStore.mockReturnValue({
      profile: null,
      primaryRole: null,
      session: {
        user: {
          user_metadata: {
            first_name: "Bob",
            last_name: "Jones",
            username: "bobj",
            role: "coach",
          },
        },
      },
    });

    const { result } = renderHook(() => useDashboardUser());

    expect(result.current).toMatchObject({
      firstName: "Bob",
      role: "coach",
      initials: "BJ",
    });
  });

  it("resolves the region name from the regions table", async () => {
    mockRegionName("Auckland");
    mockStore.mockReturnValue({
      profile: {
        first_name: "Alice",
        last_name: "Smith",
        username: "alice",
        region_id: "r1",
      },
      primaryRole: "player",
      session: null,
    });

    const { result } = renderHook(() => useDashboardUser());

    await waitFor(() => expect(result.current?.regionName).toBe("Auckland"));
    expect(mockFrom).toHaveBeenCalledWith("regions");
  });
});
