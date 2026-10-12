import { useCallback, useEffect, useRef, useState } from "react";

import type { PlayerEngineRef, PlayerEngineState, PlayerRate } from "./types";

const INITIAL_STATE: PlayerEngineState = {
  currentTime: 0,
  duration: 0,
  // Both engines autoplay on open (see UploadVideoSurface/YouTubeVideoSurface)
  // — starting this true avoids a one-frame flash of the paused UI before
  // the first real state report arrives.
  isPlaying: true,
};

/** Bridges PlayerControls to whichever engine ref is currently mounted
 * (expo-video or react-native-youtube-iframe — see VideoSurface), and
 * handles the one piece of cross-engine logic neither surface implements
 * on its own: making rapid skip taps *and* scrub-bar seeks net correctly
 * despite both engines' seeks being eventually-consistent — each is
 * computed from the last *requested* target rather than the last
 * *engine-reported* time, and `displayTime` (not `engineState.currentTime`)
 * is what the UI renders, so the scrub thumb doesn't visibly snap back to
 * the pre-seek position for the ~250ms it takes the engine to catch up.
 * `pendingSeekTarget` is state, not a ref, specifically so setting it
 * re-renders immediately instead of waiting for the next unrelated update. */
export function usePlayerControls() {
  const engineRef = useRef<PlayerEngineRef>(null);
  const [pendingSeekTarget, setPendingSeekTarget] = useState<number | null>(
    null,
  );
  const [engineState, setEngineState] =
    useState<PlayerEngineState>(INITIAL_STATE);
  const [rate, setRateState] = useState<PlayerRate>(1);

  useEffect(() => {
    if (
      pendingSeekTarget !== null &&
      Math.abs(engineState.currentTime - pendingSeekTarget) < 0.3
    ) {
      setPendingSeekTarget(null);
    }
  }, [engineState.currentTime, pendingSeekTarget]);

  const displayTime = pendingSeekTarget ?? engineState.currentTime;

  const handleSkip = useCallback(
    (delta: number) => {
      const base = pendingSeekTarget ?? engineState.currentTime;
      const target = Math.min(
        engineState.duration || Infinity,
        Math.max(0, base + delta),
      );
      setPendingSeekTarget(target);
      engineRef.current?.seekTo(target);
    },
    [pendingSeekTarget, engineState.currentTime, engineState.duration],
  );

  const handleSeek = useCallback((seconds: number) => {
    setPendingSeekTarget(seconds);
    engineRef.current?.seekTo(seconds);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (engineState.isPlaying) {
      engineRef.current?.pause();
    } else {
      engineRef.current?.play();
    }
  }, [engineState.isPlaying]);

  const handleRateChange = useCallback((next: PlayerRate) => {
    setRateState(next);
    engineRef.current?.setRate(next);
  }, []);

  return {
    engineRef,
    engineState,
    setEngineState,
    displayTime,
    rate,
    handleSkip,
    handleSeek,
    handlePlayPause,
    handleRateChange,
  };
}
