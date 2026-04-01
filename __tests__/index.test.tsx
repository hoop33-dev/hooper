import React from "react";
import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../app/index";

describe("HomeScreen", () => {
  test("renders the welcome text", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Welcome to Hooper!")).toBeTruthy();
  });
});
