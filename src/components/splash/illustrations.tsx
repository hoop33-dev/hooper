import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const VIEWBOX_W = 300;
const VIEWBOX_H = 260;

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width="100%"
      height="100%"
      fill="none"
    >
      {children}
    </Svg>
  );
}

/** Slide 1 — Court arc with glowing basketball */
export function CourtIllustration() {
  return (
    <Frame>
      <Ellipse
        cx="150"
        cy="280"
        rx="180"
        ry="130"
        stroke="rgba(241,88,37,0.15)"
        strokeWidth="1"
      />
      <Ellipse
        cx="150"
        cy="280"
        rx="130"
        ry="90"
        stroke="rgba(241,88,37,0.1)"
        strokeWidth="1"
      />
      <Ellipse
        cx="150"
        cy="280"
        rx="80"
        ry="55"
        stroke="rgba(241,88,37,0.08)"
        strokeWidth="1"
      />
      <Rect
        x="105"
        y="140"
        width="90"
        height="110"
        rx="4"
        stroke="rgba(241,88,37,0.2)"
        strokeWidth="1.5"
        fill="none"
      />
      <Ellipse
        cx="150"
        cy="140"
        rx="45"
        ry="30"
        stroke="rgba(241,88,37,0.2)"
        strokeWidth="1.5"
        fill="none"
      />
      <Line
        x1="130"
        y1="60"
        x2="170"
        y2="60"
        stroke="#F15825"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Line
        x1="120"
        y1="50"
        x2="180"
        y2="50"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M130 60 L135 90 M170 60 L165 90 M140 60 L140 90 M150 60 L150 90 M160 60 L160 90 M135 90 Q150 98 165 90"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
        fill="none"
      />
      <Circle cx="150" cy="115" r="30" fill="rgba(241,88,37,0.15)" />
      <Circle cx="150" cy="115" r="20" fill="#F15825" opacity="0.95" />
      <Circle cx="150" cy="115" r="20" fill="url(#ballGlow)" opacity="0.3" />
      <Path
        d="M133 110 Q150 118 167 110"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M134 120 Q150 112 166 120"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M150 95 Q142 115 150 135"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.2"
        fill="none"
      />
      <Path
        d="M150 95 Q158 115 150 135"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.2"
        fill="none"
      />
      <Defs>
        <RadialGradient id="ballGlow" cx="40%" cy="35%" r="60%">
          <Stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="white" stopOpacity="0" />
        </RadialGradient>
      </Defs>
    </Frame>
  );
}

/** Slide 2 — Coach + athlete network nodes */
export function CoachConnectIllustration() {
  const athletes = [
    { cx: 80, cy: 80, dot: { cx: 98, cy: 64, fill: "#F15825" } },
    { cx: 220, cy: 80, dot: { cx: 238, cy: 64, fill: "#F15825" } },
    { cx: 60, cy: 180, dot: { cx: 76, cy: 196, fill: "#38A169" } },
    { cx: 240, cy: 180, dot: { cx: 256, cy: 196, fill: "#38A169" } },
  ];

  return (
    <Frame>
      <Line
        x1="150"
        y1="130"
        x2="80"
        y2="80"
        stroke="rgba(241,88,37,0.3)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <Line
        x1="150"
        y1="130"
        x2="220"
        y2="80"
        stroke="rgba(241,88,37,0.3)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <Line
        x1="150"
        y1="130"
        x2="60"
        y2="180"
        stroke="rgba(241,88,37,0.3)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <Line
        x1="150"
        y1="130"
        x2="240"
        y2="180"
        stroke="rgba(241,88,37,0.3)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      <Circle cx="150" cy="130" r="28" fill="#00205C" />
      <Circle
        cx="150"
        cy="130"
        r="28"
        stroke="rgba(241,88,37,0.5)"
        strokeWidth="2"
      />
      <Circle cx="150" cy="122" r="9" fill="rgba(255,255,255,0.8)" />
      <Path
        d="M128 150 Q128 136 150 136 Q172 136 172 150"
        fill="rgba(255,255,255,0.5)"
      />

      {athletes.map((a, i) => (
        <G key={i}>
          <Circle
            cx={a.cx}
            cy={a.cy}
            r="18"
            fill="#2D2829"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />
          <Circle cx={a.cx} cy={a.cy - 5} r="6" fill="rgba(255,255,255,0.5)" />
          <Path
            d={`M${a.cx - 12} ${a.cy + 15} Q${a.cx - 12} ${a.cy + 7} ${a.cx} ${a.cy + 7} Q${a.cx + 12} ${a.cy + 7} ${a.cx + 12} ${a.cy + 15}`}
            fill="rgba(255,255,255,0.3)"
          />
          <Circle cx={a.dot.cx} cy={a.dot.cy} r="5" fill={a.dot.fill} />
        </G>
      ))}
    </Frame>
  );
}

/** Slide 3 — Bar chart of weekly volume */
export function ProgressIllustration() {
  const bars = [
    { x: 55, h: 60 },
    { x: 95, h: 90 },
    { x: 135, h: 75 },
    { x: 175, h: 120 },
    { x: 215, h: 100 },
    { x: 255, h: 140 },
  ];
  const labels = ["M", "T", "W", "T", "F", "S"];
  const grid = [200, 170, 140, 110, 80];

  return (
    <Frame>
      {grid.map((y, i) => (
        <Line
          key={i}
          x1="40"
          y1={y}
          x2="270"
          y2={y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {bars.map((b, i) => {
        const isLast = i === bars.length - 1;
        return (
          <G key={i}>
            <Rect
              x={b.x - 14}
              y={200 - b.h}
              width="28"
              height={b.h}
              rx="4"
              fill={isLast ? "#F15825" : "rgba(241,88,37,0.25)"}
              stroke={isLast ? "rgba(241,88,37,0.6)" : "transparent"}
              strokeWidth="1"
            />
            {isLast && (
              <Circle cx={b.x} cy={200 - b.h - 6} r="4" fill="#F15825" />
            )}
          </G>
        );
      })}

      <Polyline
        points="55,145 95,115 135,130 175,82 215,102 255,62"
        stroke="rgba(241,88,37,0.5)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5 3"
      />

      <Line
        x1="40"
        y1="200"
        x2="270"
        y2="200"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />

      {labels.map((d, i) => (
        <SvgText
          key={i}
          x={55 + i * 40}
          y="218"
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="10"
          fontFamily="Inter"
        >
          {d}
        </SvgText>
      ))}

      <Rect
        x="190"
        y="42"
        width="75"
        height="30"
        rx="6"
        fill="#2D2829"
        stroke="rgba(241,88,37,0.4)"
        strokeWidth="1"
      />
      <SvgText
        x="227"
        y="62"
        textAnchor="middle"
        fill="#F15825"
        fontSize="13"
        fontWeight="800"
        fontFamily="Inter"
      >
        +24%
      </SvgText>
    </Frame>
  );
}
