import { bodyFont } from "@/src/constants/theme";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";

type IconProps = { size?: number; color: string };

export function DumbbellIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.4 14.4L9.6 9.6M18.7 5.3l-1.4-1.4-2.1 2.1M20.8 7.4l-1.4-1.4M3.2 16.6l1.4 1.4 2.1-2.1M5.3 18.7l1.4 1.4M19.1 11.4l-2.1-2.1M7 17l-2.1-2.1"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PauseIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={4} width={4} height={16} rx={1} fill={color} />
      <Rect x={14} y={4} width={4} height={16} rx={1} fill={color} />
    </Svg>
  );
}

export function PlayIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M2 1l11 6-11 6z" fill={color} />
    </Svg>
  );
}

export function NoteIcon({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-6z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 3v5a1 1 0 001 1h4M8 13h8M8 17h5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Ring + arrowhead shared by SkipBack10Icon/SkipForward10Icon — a real
 * circle (not a hand-drawn arc) with an exact gap cut via strokeDasharray,
 * rotated to put the gap at the top-right, and an arrowhead triangle
 * anchored with the same trig used to place the gap so its tip sits
 * exactly on the ring rather than floating near it. The "forward" variant
 * mirrors this whole group horizontally; the "10" text is drawn separately
 * (never mirrored, so the glyph itself always reads correctly). */
const SKIP_RING_RADIUS = 7.5;
const SKIP_RING_ROTATION_DEG = -55;
function SkipRing({ color, mirrored }: { color: string; mirrored?: boolean }) {
  const circumference = 2 * Math.PI * SKIP_RING_RADIUS;
  const gapDeg = 70;
  const arcLen = ((360 - gapDeg) / 360) * circumference;
  const gapLen = circumference - arcLen;
  return (
    <G transform={mirrored ? "scale(-1,1) translate(-24,0)" : undefined}>
      <Circle
        cx={12}
        cy={12}
        r={SKIP_RING_RADIUS}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${gapLen}`}
        transform={`rotate(${SKIP_RING_ROTATION_DEG} 12 12)`}
      />
      {/* Arrowhead tip anchored at (16.30, 5.86) — the ring's arc-start
       * point after the rotation above — pointing along the ring's
       * clockwise tangent there, so it reads as a continuation of the arc. */}
      <Path d="M18.3 7.2L15.7 6.8 16.9 5.0Z" fill={color} />
    </G>
  );
}

export function SkipBack10Icon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SkipRing color={color} mirrored />
      <SvgText
        x={12}
        y={14.6}
        fontSize={7}
        fontFamily={bodyFont("700")}
        fill={color}
        textAnchor="middle">
        10
      </SvgText>
    </Svg>
  );
}

export function SkipForward10Icon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <SkipRing color={color} />
      <SvgText
        x={12}
        y={14.6}
        fontSize={7}
        fontFamily={bodyFont("700")}
        fill={color}
        textAnchor="middle">
        10
      </SvgText>
    </Svg>
  );
}

export function ClockIcon({ size = 12, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
