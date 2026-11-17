import type { ExercisePhotoRow } from "@hooper/db";
import { describe, expect, it } from "vitest";
import {
  draftsFromPhotos,
  photosChanged,
  removedPhotoPaths,
  validatePhotos,
  type PhotoDraft,
} from "./photoFieldState";

function row(id: string, position: number, caption = `Cap ${id}`) {
  return {
    id,
    exercise_id: "ex",
    position,
    url: `https://cdn/${id}.jpg`,
    storage_path: `prof/ex/${id}.jpg`,
    caption,
    created_at: "",
  } satisfies ExercisePhotoRow;
}

function draft(overrides: Partial<PhotoDraft> = {}): PhotoDraft {
  return {
    key: "k",
    storagePath: null,
    file: null,
    previewUrl: null,
    caption: "",
    ...overrides,
  };
}

const file = new File(["x"], "a.jpg", { type: "image/jpeg" });

describe("validatePhotos", () => {
  it("passes when every row has an image and a caption", () => {
    expect(
      validatePhotos([
        draft({ key: "a", storagePath: "p/a.jpg", caption: "Spot 1" }),
        draft({ key: "b", file, caption: "Spot 2" }),
      ]),
    ).toEqual({});
  });

  it("flags a blank added row for both image and caption", () => {
    expect(validatePhotos([draft({ key: "a" })])).toEqual({
      a: {
        image: "Add a photo or remove this row",
        caption: "Caption is required",
      },
    });
  });

  it("flags a whitespace-only caption on a row with an image", () => {
    expect(validatePhotos([draft({ key: "a", file, caption: "   " })])).toEqual(
      { a: { caption: "Caption is required" } },
    );
  });

  it("flags a captioned row with no image", () => {
    expect(validatePhotos([draft({ key: "a", caption: "Spot 1" })])).toEqual({
      a: { image: "Add a photo or remove this row" },
    });
  });

  it("flags a caption over 40 characters", () => {
    expect(
      validatePhotos([draft({ key: "a", file, caption: "x".repeat(41) })]).a
        ?.caption,
    ).toMatch(/40/);
  });
});

describe("removedPhotoPaths", () => {
  const initial = [row("a", 0), row("b", 1), row("c", 2)];

  it("returns nothing when every stored photo is kept", () => {
    expect(removedPhotoPaths(initial, draftsFromPhotos(initial))).toEqual([]);
  });

  it("returns removed and replaced photos' paths", () => {
    const drafts = draftsFromPhotos(initial);
    drafts.splice(0, 1); // remove a
    drafts[0] = { ...drafts[0], storagePath: null, file }; // replace b
    expect(removedPhotoPaths(initial, drafts)).toEqual([
      "prof/ex/a.jpg",
      "prof/ex/b.jpg",
    ]);
  });
});

describe("photosChanged", () => {
  const initial = [row("a", 0), row("b", 1)];

  it("is false for an untouched list", () => {
    expect(photosChanged(initial, draftsFromPhotos(initial))).toBe(false);
  });

  it("detects a reorder", () => {
    expect(photosChanged(initial, draftsFromPhotos(initial).reverse())).toBe(
      true,
    );
  });

  it("detects a caption edit and an added row", () => {
    const edited = draftsFromPhotos(initial);
    edited[1] = { ...edited[1], caption: "New" };
    expect(photosChanged(initial, edited)).toBe(true);
    expect(
      photosChanged(initial, [...draftsFromPhotos(initial), draft()]),
    ).toBe(true);
  });
});
