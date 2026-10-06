export type PlayerRate = 0.5 | 1 | 1.5;

/** Live playback state, reported upward from whichever engine (expo-video or
 * react-native-youtube-iframe) is currently mounted. */
export type PlayerEngineState = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
};

/** Imperative commands, exposed via ref so PlayerControls doesn't need to
 * know which engine is mounted. Both engines implement this the same way
 * from the outside despite very differently shaped native APIs underneath —
 * expo-video is a live object with settable properties, react-native-youtube-iframe
 * is an async ref plus controlled props. */
export type PlayerEngineRef = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: PlayerRate) => void;
};
