import { uploadAvatar } from "@/src/services/profile.service";
import { initClient } from "@hooper/api";

const mockSupabase = {
  storage: { from: jest.fn() },
};

const mockStorageFrom = mockSupabase.storage.from;

beforeEach(() => {
  jest.clearAllMocks();
  initClient(mockSupabase as any);
});

// ─── uploadAvatar ─────────────────────────────────────────────────────────────

describe("uploadAvatar", () => {
  function mockStorage(
    uploadResult: unknown,
    publicUrl = "https://cdn/avatar.jpg",
  ) {
    const upload = jest.fn().mockResolvedValue(uploadResult);
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl } });
    mockStorageFrom.mockReturnValue({ upload, getPublicUrl });
    return { upload, getPublicUrl };
  }

  it("decodes base64 to the original bytes (no network fetch needed)", async () => {
    // "Hi" base64-encodes to "SGk=" — verifies the decoder produces raw bytes
    // rather than relying on fetch(uri), which fails on Android file:// URIs.
    const { upload } = mockStorage({ error: null });

    await uploadAvatar("user-1", "SGk=", "image/jpeg");

    const bytes = upload.mock.calls[0][1] as Uint8Array;
    expect(Array.from(bytes)).toEqual([72, 105]); // 'H', 'i'
  });

  it("strips a data-URL prefix before decoding", async () => {
    const { upload } = mockStorage({ error: null });

    await uploadAvatar("user-1", "data:image/png;base64,SGk=", "image/png");

    const bytes = upload.mock.calls[0][1] as Uint8Array;
    expect(Array.from(bytes)).toEqual([72, 105]);
  });

  it("uses the mime type to pick the file extension and content type", async () => {
    const { upload } = mockStorage({ error: null });

    await uploadAvatar("user-1", "SGk=", "image/png");

    const path = upload.mock.calls[0][0] as string;
    const options = upload.mock.calls[0][2] as { contentType: string };
    expect(path).toMatch(/^user-1\/\d+\.png$/);
    expect(options.contentType).toBe("image/png");
  });

  it("returns the public URL on success", async () => {
    mockStorage({ error: null }, "https://cdn/me.jpg");

    const url = await uploadAvatar("user-1", "SGk=", "image/jpeg");

    expect(url).toBe("https://cdn/me.jpg");
  });

  it("throws a friendly error when the upload fails", async () => {
    mockStorage({ error: { message: "boom" } });

    await expect(uploadAvatar("user-1", "SGk=", "image/jpeg")).rejects.toThrow(
      "Failed to upload photo. Please try again.",
    );
  });
});
