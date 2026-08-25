import { colors } from "@/src/constants/theme";
import type { ExerciseVideoOrientation, ExerciseVideoSource } from "@hooper/db";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PlayerControls } from "./PlayerControls";
import { usePlayerControls } from "./usePlayerControls";
import { VideoSurface } from "./VideoSurface";

type VideoPlayerModalProps = {
  visible: boolean;
  onClose: () => void;
  videoUrl: string;
  videoSource: ExerciseVideoSource;
  videoOrientation: ExerciseVideoOrientation | null;
  title: string;
};

/** Full-screen in-app player, opened from an exercise's video thumbnail.
 * Always starts playing automatically from 0:00 at 1x — the body below is
 * only mounted while `visible`, so every open is a fresh engine instance
 * rather than a resumed one. */
function PlayerBody({
  videoUrl,
  videoSource,
  title,
  onClose,
}: Omit<VideoPlayerModalProps, "visible" | "videoOrientation">) {
  const {
    engineRef,
    engineState,
    setEngineState,
    displayTime,
    rate,
    handleSkip,
    handleSeek,
    handlePlayPause,
    handleRateChange,
  } = usePlayerControls();
  const [videoAreaSize, setVideoAreaSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) =>
        setVideoAreaSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }>
      <LinearGradient
        colors={["#16261F", "#0E1512", colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <VideoSurface
        ref={engineRef}
        videoUrl={videoUrl}
        videoSource={videoSource}
        containerWidth={videoAreaSize.width}
        containerHeight={videoAreaSize.height}
        onStateChange={setEngineState}
      />
      {videoSource === "upload" ? (
        // Tap-anywhere-to-pause only for uploaded videos — YouTube's own
        // iframe page already owns touch handling inside its WebView. This
        // sits *above* VideoSurface rather than wrapping around it: expo-video's
        // VideoView is a native view with its own internal touch handling,
        // which swallowed taps before they ever reached a JS-side Pressable
        // wrapped around it. A plain RN view layered on top intercepts the
        // tap directly instead of relying on it bubbling up through the
        // native video surface. It still sits below PlayerControls (next),
        // so those buttons keep first claim on their own taps.
        <Pressable onPress={handlePlayPause} style={StyleSheet.absoluteFill} />
      ) : null}
      <PlayerControls
        title={title}
        currentTime={displayTime}
        duration={engineState.duration}
        isPlaying={engineState.isPlaying}
        rate={rate}
        onPlayPause={handlePlayPause}
        onSkip={handleSkip}
        onSeek={handleSeek}
        onRateChange={handleRateChange}
        onClose={onClose}
        minimal={videoSource === "link"}
      />
    </View>
  );
}

export function VideoPlayerModal({
  visible,
  onClose,
  videoUrl,
  videoSource,
  videoOrientation,
  title,
}: VideoPlayerModalProps) {
  // Key on the video so switching to a different exercise's video while
  // (in theory) reusing this component tree still forces a fresh mount.
  const bodyKey = useMemo(() => videoUrl, [videoUrl]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.surface }}
        edges={["top", "bottom"]}>
        {visible ? (
          <PlayerBody
            key={bodyKey}
            videoUrl={videoUrl}
            videoSource={videoSource}
            title={title}
            onClose={onClose}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
