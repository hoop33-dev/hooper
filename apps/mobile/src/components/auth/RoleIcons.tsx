import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

export function PlayerIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Circle cx={32} cy={32} r={20} fill="#F15825" opacity={0.15} />
      <Circle cx={32} cy={32} r={16} fill="#F15825" opacity={0.9} />
      <Path
        d="M18 28 Q32 35 46 28"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M18 36 Q32 29 46 36"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M32 16 Q25 32 32 48"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M32 16 Q39 32 32 48"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.4}
        fill="none"
      />
      <Circle cx={26} cy={26} r={4} fill="rgba(255,255,255,0.2)" />
      <Circle cx={32} cy={32} r={22} fill="rgba(241,88,37,0.12)" />
    </Svg>
  );
}

export function ParentIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Circle cx={24} cy={18} r={8} fill="#F68D68" opacity={0.9} />
      <Path d="M10 46 Q10 32 24 32 Q38 32 38 46" fill="#F68D68" opacity={0.7} />
      <Circle cx={42} cy={22} r={6} fill="#F15825" opacity={0.9} />
      <Path d="M30 46 Q30 36 42 36 Q54 36 54 46" fill="#F15825" opacity={0.7} />
      <Path d="M30 26 Q32 22 34 26 Q36 30 32 33 Q28 30 30 26Z" fill="#F15825" />
    </Svg>
  );
}

export function CoachIcon() {
  return (
    <Svg viewBox="0 0 64 64" width={48} height={48} fill="none">
      <Rect
        x={14}
        y={16}
        width={36}
        height={40}
        rx={5}
        fill="#00205C"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1.5}
      />
      <Rect
        x={24}
        y={12}
        width={16}
        height={8}
        rx={4}
        fill="#3D3738"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
      />
      <Line
        x1={22}
        y1={30}
        x2={42}
        y2={30}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={22}
        y1={37}
        x2={38}
        y2={37}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Line
        x1={22}
        y1={44}
        x2={34}
        y2={44}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M22 30 L25 33 L30 27"
        stroke="#F15825"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
