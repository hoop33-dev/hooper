import type { ExerciseVideoSource } from "@hooper/db";
import { forwardRef } from "react";

import type { PlayerEngineRef, PlayerEngineState } from "./types";
import { UploadVideoSurface } from "./UploadVideoSurface";
import { YouTubeVideoSurface } from "./YouTubeVideoSurface";

type VideoSurfaceProps = {
  videoUrl: string;
  videoSource: ExerciseVideoSource;
  containerWidth: number;
  containerHeight: number;
  onStateChange: (state: PlayerEngineState) => void;
};

/** Dispatches to the right playback engine by video source — expo-video
 * (UploadVideoSurface) for uploaded files, a hand-rolled IFrame API WebView
 * (YouTubeVideoSurface) for YouTube links, since expo-video can't play
 * YouTube (its terms block raw stream extraction). "link" videos are assumed
 * to be YouTube; other hosts aren't supported yet. */
export const VideoSurface = forwardRef<PlayerEngineRef, VideoSurfaceProps>(
  function VideoSurface(
    { videoUrl, videoSource, containerWidth, containerHeight, onStateChange },
    ref,
  ) {
    if (videoSource === "upload") {
      return (
        <UploadVideoSurface
          ref={ref}
          videoUrl={videoUrl}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          onStateChange={onStateChange}
        />
      );
    }

    return (
      <YouTubeVideoSurface
        ref={ref}
        videoUrl={videoUrl}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        onStateChange={onStateChange}
      />
    );
  },
);
