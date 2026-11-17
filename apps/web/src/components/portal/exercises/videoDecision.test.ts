import { describe, expect, it } from "vitest";
import {
  computeVideoDecision,
  getVideoSwitchWarning,
  type VideoFieldState,
} from "./videoDecision";

function state(overrides: Partial<VideoFieldState> = {}): VideoFieldState {
  return {
    mode: "upload",
    file: null,
    linkUrl: "",
    removed: false,
    ...overrides,
  };
}

describe("computeVideoDecision", () => {
  it("clears when explicitly removed, regardless of other state", () => {
    expect(
      computeVideoDecision(
        state({ removed: true, linkUrl: "https://x.com" }),
        "upload",
      ),
    ).toEqual({
      action: "clear",
    });
  });

  it("sets a link when the link tab has a non-empty URL", () => {
    expect(
      computeVideoDecision(
        state({ mode: "link", linkUrl: "  https://youtu.be/abc  " }),
        null,
      ),
    ).toEqual({ action: "set-link", url: "https://youtu.be/abc" });
  });

  it("clears when the link tab is active but empty", () => {
    expect(
      computeVideoDecision(state({ mode: "link", linkUrl: "   " }), "link"),
    ).toEqual({
      action: "clear",
    });
  });

  it("flags an upload as pending when a file is chosen", () => {
    const file = new File([], "demo.mp4");
    expect(computeVideoDecision(state({ mode: "upload", file }), null)).toEqual(
      {
        action: "upload-pending",
      },
    );
  });

  it("leaves an existing upload untouched when the upload tab has no new file", () => {
    expect(computeVideoDecision(state({ mode: "upload" }), "upload")).toEqual({
      action: "none",
    });
  });

  it("clears when switching to the upload tab without picking a file", () => {
    expect(computeVideoDecision(state({ mode: "upload" }), "link")).toEqual({
      action: "clear",
    });
    expect(computeVideoDecision(state({ mode: "upload" }), null)).toEqual({
      action: "clear",
    });
  });

  it("leaves an existing link untouched (re-set, not cleared) when the video field is never opened", () => {
    // Regression: the modal's initial state must mirror the exercise's existing
    // video_source, otherwise saving unrelated fields on a link exercise wipes it.
    const untouched = state({
      mode: "link",
      linkUrl: "https://youtu.be/existing",
    });
    expect(computeVideoDecision(untouched, "link")).toEqual({
      action: "set-link",
      url: "https://youtu.be/existing",
    });
  });
});

describe("getVideoSwitchWarning", () => {
  it("warns when opening the link tab over an existing upload", () => {
    expect(
      getVideoSwitchWarning("link", "upload", "https://x.com/demo.mp4"),
    ).toMatch(/uploaded video/);
  });

  it("warns when opening the upload tab over an existing link", () => {
    expect(
      getVideoSwitchWarning("upload", "link", "https://youtu.be/abc"),
    ).toMatch(/linked video/);
  });

  it("is silent when the active tab already matches the existing video", () => {
    expect(
      getVideoSwitchWarning("upload", "upload", "https://x.com/demo.mp4"),
    ).toBeNull();
    expect(
      getVideoSwitchWarning("link", "link", "https://youtu.be/abc"),
    ).toBeNull();
  });

  it("is silent when there is no existing video to lose", () => {
    expect(getVideoSwitchWarning("link", null, undefined)).toBeNull();
    expect(getVideoSwitchWarning("upload", "upload", null)).toBeNull();
  });
});
