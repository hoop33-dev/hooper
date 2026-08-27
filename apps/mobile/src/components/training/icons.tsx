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
 * rotated to put the gap at the top-right, and an arrowhead triangle whose
 * points are computed from the same angle so its tip always sits exactly
 * on the ring (rather than a hand-placed shape that can drift out of sync
 * with the ring's radius/rotation, as it previously did). The "forward"
 * variant mirrors this whole group horizontally; the "10" text is drawn
 * separately (never mirrored, so the glyph itself always reads correctly). */
const SKIP_RING_RADIUS = 7.5;
const SKIP_RING_ROTATION_DEG = -55;
const SKIP_RING_GAP_DEG = 70;
const SKIP_ARROW_LENGTH = 3.6;
const SKIP_ARROW_WIDTH = 3.6;
function SkipRing({ color, mirrored }: { color: string; mirrored?: boolean }) {
  const circumference = 2 * Math.PI * SKIP_RING_RADIUS;
  const arcLen = ((360 - SKIP_RING_GAP_DEG) / 360) * circumference;
  const gapLen = circumference - arcLen;

  // The dash (visible arc) starts at the circle's implicit 0° point, so
  // after the ring's own rotation the arc's leading tip sits at angle
  // SKIP_RING_ROTATION_DEG. The arrowhead is a triangle whose tip is that
  // point and whose base trails behind it along the ring's clockwise
  // tangent there, so it reads as a continuation of the arc.
  const tipAngleRad = (SKIP_RING_ROTATION_DEG * Math.PI) / 180;
  const tipX = 12 + SKIP_RING_RADIUS * Math.cos(tipAngleRad);
  const tipY = 12 + SKIP_RING_RADIUS * Math.sin(tipAngleRad);
  const tangentX = -Math.sin(tipAngleRad);
  const tangentY = Math.cos(tipAngleRad);
  const perpX = -tangentY;
  const perpY = tangentX;
  const baseX = tipX - SKIP_ARROW_LENGTH * tangentX;
  const baseY = tipY - SKIP_ARROW_LENGTH * tangentY;
  const halfWidth = SKIP_ARROW_WIDTH / 2;
  const corner1X = baseX + halfWidth * perpX;
  const corner1Y = baseY + halfWidth * perpY;
  const corner2X = baseX - halfWidth * perpX;
  const corner2Y = baseY - halfWidth * perpY;
  const arrowPath = `M${tipX.toFixed(2)} ${tipY.toFixed(2)} L${corner1X.toFixed(2)} ${corner1Y.toFixed(2)} L${corner2X.toFixed(2)} ${corner2Y.toFixed(2)} Z`;

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
      <Path d={arrowPath} fill={color} />
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
