import { describe, expect, it } from "vitest";
import {
  isPublicPath,
  isSignedOutOnlyPath,
  parsePackageParam,
  withPackage,
} from "./routes";

describe("withPackage", () => {
  it("appends the slug with ? or &", () => {
    expect(withPackage("/signin", "off-season")).toBe(
      "/signin?package=off-season",
    );
    expect(withPackage("/checkout?verified=1", "x1")).toBe(
      "/checkout?verified=1&package=x1",
    );
  });
  it("leaves the path alone without a package", () => {
    expect(withPackage("/signin", null)).toBe("/signin");
  });
});

describe("parsePackageParam", () => {
  it("accepts kebab-case slugs", () => {
    expect(parsePackageParam("shooting-mechanics")).toBe("shooting-mechanics");
    expect(parsePackageParam(["abc", "def"])).toBe("abc");
  });
  it("rejects anything that couldn't be a slug", () => {
    expect(parsePackageParam(undefined)).toBeNull();
    expect(parsePackageParam("Bad Slug")).toBeNull();
    expect(parsePackageParam("a--b")).toBeNull();
    expect(parsePackageParam("x".repeat(41))).toBeNull();
  });
});

describe("route gating", () => {
  it("treats the auth flow as public", () => {
    for (const p of [
      "/start",
      "/signin",
      "/signup",
      "/signup/verify",
      "/reset",
      "/reset/callback",
      "/reset/confirm",
    ]) {
      expect(isPublicPath(p)).toBe(true);
    }
  });
  it("keeps checkout, welcome and the portal private", () => {
    for (const p of ["/", "/checkout", "/welcome", "/account", "/resetx"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
  it("only bounces signed-in users off the entry screens", () => {
    expect(isSignedOutOnlyPath("/signin")).toBe(true);
    expect(isSignedOutOnlyPath("/signup/verify")).toBe(false);
  });
});
