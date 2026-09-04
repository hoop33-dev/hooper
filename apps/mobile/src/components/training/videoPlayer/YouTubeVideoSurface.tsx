import { getYoutubeVideoId } from "@/src/lib/youtube";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { PlayerEngineRef, PlayerEngineState } from "./types";

type YouTubeVideoSurfaceProps = {
  videoUrl: string;
  containerWidth: number;
  containerHeight: number;
  onStateChange: (state: PlayerEngineState) => void;
};

const YT_PLAYING = 1;

/** The `origin` playerVar (below) and the WebView's `baseUrl` (in the
 * component) must agree on some real-looking https origin — YouTube's
 * player validates the embedding request's origin, and a page loaded from
 * an in-memory HTML string (no real URL) has none to offer, which surfaces
 * to the viewer as "Error 153: Video player configuration error" without
 * this pairing. It must NOT be youtube.com itself, though: impersonating
 * YouTube's own domain as the embedding page's origin trips a different
 * failure (seen as "Error code 152 - 4") — some other neutral domain (it
 * doesn't need to resolve to anything) avoids both. */
const FAKE_ORIGIN = "https://app.hooper.co";

/** A self-contained HTML page embedding the YouTube IFrame API directly —
 * this replaces react-native-youtube-iframe (see the surface's own comment
 * below for why). YouTube's own `autoplay: 1` playerVar drives the
 * "starts playing automatically" behavior natively, rather than a
 * play()-once-ready round trip. */
function buildPlayerHtml(videoId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; background: #000; overflow: hidden; height: 100%; }
  #player, #player iframe { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="player"></div>
<script>
  var player;
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(tag);

  function post(type, data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
  }

  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      videoId: '${videoId}',
      playerVars: {
        controls: 1,
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
        autoplay: 1,
        origin: '${FAKE_ORIGIN}'
      },
      events: {
        onReady: function() {
          post('ready');
          setInterval(function() {
            if (player && player.getCurrentTime) {
              post('time', { currentTime: player.getCurrentTime(), duration: player.getDuration() });
            }
          }, 250);
        },
        onStateChange: function(e) { post('stateChange', e.data); },
        onError: function(e) { post('error', e.data); }
      }
    });
  }
</script>
</body>
</html>`;
}

type PageMessage = {
  onTime: (currentTime: number, duration: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
};

/** Parses one `postMessage` from the page (see buildPlayerHtml's `post`
 * helper) and dispatches it to the right setter. Player errors are only
 * logged — there's no in-app surface for them (yet), but past bugs here
 * (Error 153, Error 152-4) were only visible in the WebView's own overlay,
 * so at least getting them into the RN console helps future diagnosis. */
function handlePageMessage(raw: string, handlers: PageMessage) {
  try {
    const message = JSON.parse(raw) as { type: string; data?: unknown };
    if (message.type === "time" && message.data) {
      const { currentTime, duration } = message.data as {
        currentTime: number;
        duration: number;
      };
      handlers.onTime(currentTime, duration);
    } else if (message.type === "stateChange") {
      handlers.onPlayingChange(message.data === YT_PLAYING);
    } else if (message.type === "error") {
      console.warn("[YouTubeVideoSurface] player error", message.data);
    }
  } catch {
    // ignore malformed messages
  }
}

/** Plays a YouTube video via a hand-rolled IFrame API page instead of the
 * react-native-youtube-iframe package. That package drives play/pause/
 * setPlaybackRate through react-native-webview's `.postMessage()` call
 * *into* the page — a separate channel from `injectJavaScript` (RN→WebView)
 * and from the page's own `postMessage` calls back to RN. In this app that
 * specific channel never delivered: seeking (`injectJavaScript`) and the
 * live time readout (page→RN `postMessage`) both worked, but play, pause,
 * and rate (the only things routed through `.postMessage()` into the page)
 * never reached the player. This wrapper only uses the two channels
 * already proven to work here — `injectJavaScript` for every command, and
 * the page pushing state back via its own `postMessage`. */
export const YouTubeVideoSurface = forwardRef<
  PlayerEngineRef,
  YouTubeVideoSurfaceProps
>(function YouTubeVideoSurface(
  { videoUrl, containerWidth, containerHeight, onStateChange },
  ref,
) {
  const webViewRef = useRef<WebView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoId = getYoutubeVideoId(videoUrl);
  const html = useMemo(
    () => (videoId ? buildPlayerHtml(videoId) : null),
    [videoId],
  );

  useEffect(() => {
    onStateChange({ currentTime, duration, isPlaying });
  }, [currentTime, duration, isPlaying, onStateChange]);

  function runInPage(script: string) {
    webViewRef.current?.injectJavaScript(`(function(){ ${script} })(); true;`);
  }

  useImperativeHandle(
    ref,
    () => ({
      play: () =>
        runInPage("if (player && player.playVideo) player.playVideo();"),
      pause: () =>
        runInPage("if (player && player.pauseVideo) player.pauseVideo();"),
      seekTo: (seconds) =>
        runInPage(
          `if (player && player.seekTo) player.seekTo(${seconds}, true);`,
        ),
      setRate: (rate) =>
        runInPage(
          `if (player && player.setPlaybackRate) player.setPlaybackRate(${rate});`,
        ),
    }),
    [],
  );

  function handleMessage(event: WebViewMessageEvent) {
    handlePageMessage(event.nativeEvent.data, {
      onTime: (t, d) => {
        setCurrentTime(t);
        setDuration(d);
      },
      onPlayingChange: setIsPlaying,
    });
  }

  if (!html || containerWidth === 0 || containerHeight === 0) return null;

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: "hidden",
      }}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: FAKE_ORIGIN }}
        originWhitelist={["*"]}
        style={{
          width: containerWidth,
          height: containerHeight,
          backgroundColor: "transparent",
        }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleMessage}
      />
    </View>
  );
});
