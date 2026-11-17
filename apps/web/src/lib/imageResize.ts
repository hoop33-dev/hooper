/** Downscales an image file to fit within `maxEdge` px on its longest side
 * and re-encodes it as JPEG — keeps phone-camera photos (often 4000px+,
 * several MB) small enough for the exercise-photos bucket and quick to load
 * on mobile. Same draw-to-canvas approach as videoThumbnailCapture.ts. */
export async function resizeImageToJpeg(
  file: Blob,
  maxEdge = 1600,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    // JPEG has no alpha — paint white first so transparent PNGs don't go black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to encode photo")),
        "image/jpeg",
        quality,
      ),
    );
  } finally {
    bitmap.close();
  }
}
