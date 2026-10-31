import { describe, expect, it } from "vitest";
import { getEmbedUrl, getYoutubeVideoId, isYoutubeUrl } from "./videoEmbed";

describe("getEmbedUrl", () => {
  it("converts youtube watch URLs", () => {
    expect(getEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("converts youtu.be short links", () => {
    expect(getEmbedUrl("https://youtu.be/abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("converts youtube shorts links", () => {
    expect(getEmbedUrl("https://youtube.com/shorts/abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("converts vimeo links", () => {
    expect(getEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });

  it("returns null for non-embeddable hosts", () => {
    expect(getEmbedUrl("https://example.com/video.mp4")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(getEmbedUrl("not a url")).toBeNull();
  });
});

describe("getYoutubeVideoId", () => {
  it("extracts the id from watch, youtu.be and shorts links", () => {
    expect(
      getYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(getYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(getYoutubeVideoId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("returns null for a malformed id or a non-YouTube host", () => {
    expect(
      getYoutubeVideoId("https://www.youtube.com/watch?v=short"),
    ).toBeNull();
    expect(getYoutubeVideoId("https://vimeo.com/123456789")).toBeNull();
    expect(getYoutubeVideoId("not a url")).toBeNull();
  });
});

describe("isYoutubeUrl", () => {
  it("accepts YouTube links only", () => {
    expect(isYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      true,
    );
    expect(isYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  });

  it("rejects Vimeo, direct links and malformed URLs", () => {
    expect(isYoutubeUrl("https://vimeo.com/123456789")).toBe(false);
    expect(isYoutubeUrl("https://example.com/video.mp4")).toBe(false);
    expect(isYoutubeUrl("not a url")).toBe(false);
  });
});
