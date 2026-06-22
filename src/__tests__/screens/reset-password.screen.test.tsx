import ResetPasswordScreen from "@/app/(auth)/reset-password";
import { exchangeResetCode, updatePassword } from "@/src/services/auth.service";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mockParams(),
}));

jest.mock("@/src/services/auth.service", () => ({
  exchangeResetCode: jest.fn(),
  updatePassword: jest.fn(),
}));

const mockExchange = exchangeResetCode as jest.Mock;
const mockUpdate = updatePassword as jest.Mock;

const VALID_PASSWORD = "Password1!";

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ code: "reset-code" });
});

function fillPasswords(pw: string, confirm: string) {
  fireEvent.changeText(
    screen.getByPlaceholderText("Min 8 chars, uppercase & number"),
    pw,
  );
  fireEvent.changeText(
    screen.getByPlaceholderText("Repeat your password"),
    confirm,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("ResetPasswordScreen", () => {
  it("shows an error when the link carries no reset code", () => {
    mockParams.mockReturnValue({});

    render(<ResetPasswordScreen />);

    expect(screen.getByText("Link invalid or expired")).toBeTruthy();
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it("exchanges the code from the deep link on mount", async () => {
    mockExchange.mockResolvedValue({ ok: true });

    render(<ResetPasswordScreen />);

    await waitFor(() => {
      expect(mockExchange).toHaveBeenCalledWith("reset-code");
    });
  });

  it("shows the invalid-link state when the code exchange fails", async () => {
    mockExchange.mockResolvedValue({
      ok: false,
      error: "Reset link is invalid or expired.",
    });

    render(<ResetPasswordScreen />);

    expect(
      await screen.findByText("Reset link is invalid or expired."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Request a new link" }),
    ).toBeTruthy();
  });

  it("validates the new password before submitting", async () => {
    mockExchange.mockResolvedValue({ ok: true });

    render(<ResetPasswordScreen />);
    const submit = await screen.findByRole("button", {
      name: "Set new password",
    });

    fillPasswords("weak", "weak");
    fireEvent.press(submit);

    expect(
      screen.getByText(
        "Min 8 characters with an uppercase letter, a number, and a special character",
      ),
    ).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("flags mismatched confirmation", async () => {
    mockExchange.mockResolvedValue({ ok: true });

    render(<ResetPasswordScreen />);
    const submit = await screen.findByRole("button", {
      name: "Set new password",
    });

    fillPasswords(VALID_PASSWORD, "Different1!");
    fireEvent.press(submit);

    expect(screen.getByText("Passwords don't match")).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the password and shows the success state", async () => {
    mockExchange.mockResolvedValue({ ok: true });
    mockUpdate.mockResolvedValue({ ok: true });

    render(<ResetPasswordScreen />);
    const submit = await screen.findByRole("button", {
      name: "Set new password",
    });

    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    fireEvent.press(submit);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(VALID_PASSWORD);
    });
    expect(await screen.findByText("Password updated")).toBeTruthy();
    // Success CTA routes back to sign-in.
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("surfaces an update failure without showing success", async () => {
    mockExchange.mockResolvedValue({ ok: true });
    mockUpdate.mockResolvedValue({ ok: false, error: "Something went wrong" });

    render(<ResetPasswordScreen />);
    const submit = await screen.findByRole("button", {
      name: "Set new password",
    });

    fillPasswords(VALID_PASSWORD, VALID_PASSWORD);
    fireEvent.press(submit);

    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("Password updated")).toBeNull();
  });
});
