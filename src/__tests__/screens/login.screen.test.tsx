import LoginScreen from "@/app/(auth)/login";
import { signInWithUsername } from "@/src/services/auth.service";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
}));

const mockSignInComplete = jest.fn();
const mockSetVerificationPending = jest.fn();
jest.mock("@/src/stores/auth.store", () => ({
  useAuthStore: () => ({
    signInComplete: mockSignInComplete,
    setVerificationPending: mockSetVerificationPending,
  }),
}));

jest.mock("@/src/services/auth.service", () => ({
  signInWithUsername: jest.fn(),
}));

const mockSignIn = signInWithUsername as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

function fillCredentials(username: string, password: string) {
  fireEvent.changeText(screen.getByPlaceholderText("jordan33"), username);
  fireEvent.changeText(screen.getByPlaceholderText("Your password"), password);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("LoginScreen", () => {
  it("validates required fields without calling the service", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("completes sign-in for a verified account", async () => {
    const session = { user: { id: "u1" } };
    mockSignIn.mockResolvedValue({
      ok: true,
      requiresVerification: false,
      session,
    });
    mockSignInComplete.mockResolvedValue(undefined);

    render(<LoginScreen />);
    fillCredentials("jordan33", "Password1");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("jordan33", "Password1");
      expect(mockSignInComplete).toHaveBeenCalledWith(session);
    });
  });

  it("routes unverified accounts to the verify-email screen", async () => {
    mockSignIn.mockResolvedValue({
      ok: true,
      requiresVerification: true,
      email: "u@example.com",
    });

    render(<LoginScreen />);
    fillCredentials("jordan33", "Password1");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSetVerificationPending).toHaveBeenCalledWith("u@example.com");
      expect(mockPush).toHaveBeenCalledWith("/(auth)/verify-email");
    });
    expect(mockSignInComplete).not.toHaveBeenCalled();
  });

  it("surfaces the service error and does not navigate", async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: "Invalid username or password.",
    });

    render(<LoginScreen />);
    fillCredentials("jordan33", "wrongpass");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid username or password."),
    ).toBeTruthy();
    expect(mockSignInComplete).not.toHaveBeenCalled();
  });

  it("trims the username before sending it to the service", async () => {
    mockSignIn.mockResolvedValue({
      ok: true,
      requiresVerification: false,
      session: { user: { id: "u1" } },
    });
    mockSignInComplete.mockResolvedValue(undefined);

    render(<LoginScreen />);
    fillCredentials("  jordan33  ", "Password1");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("jordan33", "Password1");
    });
  });

  it("navigates to forgot-password and sign-up flows", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText("Forgot password?"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/forgot-password");

    fireEvent.press(screen.getByText("Create one"));
    expect(mockPush).toHaveBeenCalledWith("/(auth)/role-selector");
  });
});
