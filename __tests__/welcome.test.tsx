import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

import WelcomeScreen from "../app/(auth)/welcome";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

jest.mock("expo-constants", () => ({
  default: { expoConfig: { version: "1.0.0" } },
}));

describe("WelcomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe("headline", () => {
    test("renders ELEVATE YOUR GAME", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("ELEVATE")).toBeTruthy();
      expect(screen.getByText("YOUR")).toBeTruthy();
      expect(screen.getByText("GAME")).toBeTruthy();
    });
  });

  describe("stat cards", () => {
    test("renders workout count", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("500K+")).toBeTruthy();
    });

    test("renders baller count", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("33K+")).toBeTruthy();
    });
  });

  describe("CTA buttons", () => {
    test("Join the Elite button is present", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("Join the Elite")).toBeTruthy();
    });

    test("Join the Elite button navigates to register", () => {
      render(<WelcomeScreen />);
      fireEvent.press(screen.getByText("Join the Elite"));
      expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
    });

    test("Sign In button is present", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("Sign In")).toBeTruthy();
    });

    test("Sign In button navigates to login", () => {
      render(<WelcomeScreen />);
      fireEvent.press(screen.getByText("Sign In"));
      expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  describe("footer", () => {
    test("renders Terms of Service link", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("Terms of Service")).toBeTruthy();
    });

    test("Terms of Service link is pressable", () => {
      render(<WelcomeScreen />);
      // Navigation target to be wired up when terms screen/URL is available
      expect(() =>
        fireEvent.press(screen.getByText("Terms of Service")),
      ).not.toThrow();
    });

    test("renders Privacy Policy link", () => {
      render(<WelcomeScreen />);
      expect(screen.getByText("Privacy Policy")).toBeTruthy();
    });

    test("Privacy Policy link is pressable", () => {
      render(<WelcomeScreen />);
      // Navigation target to be wired up when privacy screen/URL is available
      expect(() =>
        fireEvent.press(screen.getByText("Privacy Policy")),
      ).not.toThrow();
    });

    test("renders app version", () => {
      render(<WelcomeScreen />);
      expect(
        screen.getByText(/Hoop 33 Training Systems • Ver 1\.0\.0/i),
      ).toBeTruthy();
    });
  });
});
