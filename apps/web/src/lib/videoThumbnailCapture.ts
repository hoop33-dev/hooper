const MAX_THUMBNAIL_WIDTH = 480;

/** Captures a single frame from a video file as a JPEG Blob, by loading it
 * in a detached <video> element and drawing a frame to a canvas — mirrors
 * readVideoDuration's approach (videoDuration.ts) for reading file
 * metadata client-side, since browsers have no direct "extract a frame"
 * API to call on a raw File. */
export function captureVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    function cleanup() {
      URL.revokeObjectURL(video.src);
    }

    video.onloadedmetadata = () => {
      // A hair past the very start avoids an all-black first frame on some
      // encodings (e.g. a fade-in), without risking seeking past the end
      // of a very short clip.
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const scale = Math.min(1, MAX_THUMBNAIL_WIDTH / video.videoWidth);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (blob) resolve(blob);
          else reject(new Error("Failed to encode thumbnail"));
        },
        "image/jpeg",
        0.82,
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Unable to read video for thumbnail"));
    };

    video.src = URL.createObjectURL(file);
  });
}
