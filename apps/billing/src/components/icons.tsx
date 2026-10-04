import type { ReactNode } from "react";

/** Lucide-style icons from the Hooper design (hooper-shared.jsx `Icon` +
 * hooper-billing-core.jsx `BIcon`). Colour comes from `currentColor`, so set
 * it with a text-* class. */
type IconProps = { size?: number; className?: string };

function Svg({
  size = 18,
  className,
  strokeWidth = 1.7,
  viewBox = "0 0 24 24",
  children,
}: IconProps & {
  strokeWidth?: number;
  viewBox?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true">
      {children}
    </svg>
  );
}

export const DumbbellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.4 14.4L9.6 9.6M18.7 5.3l-1.4-1.4-2.1 2.1M20.8 7.4l-1.4-1.4M3.2 16.6l1.4 1.4 2.1-2.1M5.3 18.7l1.4 1.4M19.1 11.4l-2.1-2.1M7 17l-2.1-2.1" />
  </Svg>
);

export const ChevronIcon = ({
  dir = "right",
  ...p
}: IconProps & { dir?: "right" | "left" | "up" | "down" }) => {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
  return (
    <Svg {...p} viewBox="0 0 16 16" strokeWidth={1.8}>
      <path d="M6 3l5 5-5 5" transform={`rotate(${rot} 8 8)`} />
    </Svg>
  );
};

export const EyeIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 6l10 7 10-7" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p} viewBox="0 0 14 14" strokeWidth={2}>
    <path d="M2 7l3.5 3.5L12 3" />
  </Svg>
);

export const CreditIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Svg>
);

export const SmartphoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <circle cx="12" cy="18" r="0.5" fill="currentColor" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);

export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const ArrowIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.9}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);
