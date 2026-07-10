import { describe, expect, it } from "vitest";
import { getEmbedUrl, isValidVideoUrl } from "./videoEmbed";

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

describe("isValidVideoUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isValidVideoUrl("https://youtube.com/watch?v=abc")).toBe(true);
    expect(isValidVideoUrl("http://example.com")).toBe(true);
  });

  it("rejects malformed or non-http(s) URLs", () => {
    expect(isValidVideoUrl("not a url")).toBe(false);
    expect(isValidVideoUrl("ftp://example.com/video.mp4")).toBe(false);
  });
});
