import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { View } from "react-native";

import type { PlayerEngineRef, PlayerEngineState } from "./types";

type UploadVideoSurfaceProps = {
  videoUrl: string;
  containerWidth: number;
  containerHeight: number;
  onStateChange: (state: PlayerEngineState) => void;
};

/** Plays an uploaded (direct file URL) exercise video via expo-video,
 * letterboxed to fit the always-portrait player frame (contentFit
 * "contain") rather than rotated to fill it — orientation-aware rotation
 * is disabled for now, see YouTubeVideoSurface for the matching note. */
export const UploadVideoSurface = forwardRef<
  PlayerEngineRef,
  UploadVideoSurfaceProps
>(function UploadVideoSurface(
  { videoUrl, containerWidth, containerHeight, onStateChange },
  ref,
) {
  const player = useVideoPlayer(videoUrl, (p) => {
    // timeUpdateEventInterval defaults to 0, which per expo-video's own
    // docs means the timeUpdate event "will not be emitted" at all — so
    // currentTime would otherwise freeze at its initial value forever.
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  const { currentTime } = useEvent(player, "timeUpdate", {
    currentTime: 0,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { duration } = useEvent(player, "sourceLoad", {
    videoSource: null,
    duration: 0,
    availableVideoTracks: [],
    availableSubtitleTracks: [],
    availableAudioTracks: [],
  });

  useEffect(() => {
    onStateChange({ currentTime, duration, isPlaying });
  }, [currentTime, duration, isPlaying, onStateChange]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => player.play(),
      pause: () => player.pause(),
      seekTo: (seconds) => {
        player.currentTime = seconds;
      },
      setRate: (rate) => {
        player.playbackRate = rate;
      },
    }),
    [player],
  );

  if (containerWidth === 0 || containerHeight === 0) return null;

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: "hidden",
      }}>
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="contain"
        style={{ width: containerWidth, height: containerHeight }}
      />
    </View>
  );
});
