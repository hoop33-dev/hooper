export const MAX_VIDEO_DURATION_SECONDS = 120;

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function exceedsMaxDuration(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds > MAX_VIDEO_DURATION_SECONDS;
}

/** Reads a video file's duration by loading its metadata in a detached <video> element. */
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Unable to read video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}
