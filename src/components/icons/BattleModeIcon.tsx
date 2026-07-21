import type { SVGProps } from "react";

export type BattleModeIconVariant =
  | "calendar"
  | "skull"
  | "target"
  | "shield"
  | "mapPin"
  | "chevron"
  | "lock"
  | "star"
  | "swords"
  | "energy"
  | "check"
  | "search"
  | "info"
  | "gift"
  | "refresh"
  | "medicalCross"
  | "wrench"
  | "clock"
  | "heart";

interface BattleModeIconProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  variant: BattleModeIconVariant;
  size?: number;
}

/**
 * Small inline-SVG icon set for Battle Hub mode cards. These exist because
 * the approved cleaned asset pack does not include calendar / skull /
 * target / shield / map-pin / chevron / lock artwork — see
 * BATTLE_HUB_PLAN.md §30-31 for the substitution note. No external icon
 * library, no Unicode/emoji glyphs: each variant is a small hand-built path
 * set styled with `currentColor` so a card's tone (cyan/purple/blue/green)
 * controls the icon color via CSS, matching the reference's per-card icon
 * treatment. Scales cleanly via the `size` prop (defaults to 24).
 *
 * `star` / `swords` / `energy` were added beyond the originally-specified
 * 7 variants for the Campaign card's stat rows (chapter stars, power,
 * energy cost) — those weren't explicitly named in the icon ban list, but
 * mixing coded SVGs with plain-text glyphs on the same screen would look
 * inconsistent, so the same treatment was extended here too. `check` was
 * added for Campaign Overview's cleared-chapter badge and progress-rail
 * node (a coded checkmark, not a Unicode "✓").
 */
export function BattleModeIcon({ variant, size = 24, ...rest }: BattleModeIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    ...rest,
  };

  switch (variant) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M16 3V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="7" y="12" width="3" height="3" rx="0.6" fill="currentColor" />
          <rect x="13" y="12" width="4" height="3" rx="0.6" fill="currentColor" opacity="0.55" />
        </svg>
      );
    case "skull":
      return (
        <svg {...common}>
          <path
            d="M12 3.2c-4.1 0-7.2 3.06-7.2 6.9 0 2.36 1.18 4.03 2.4 5.1v2.1c0 .66.53 1.2 1.2 1.2h1v1.4c0 .55.45 1 1 1h3.16c.55 0 1-.45 1-1v-1.4h1c.66 0 1.2-.54 1.2-1.2v-2.1c1.22-1.07 2.4-2.74 2.4-5.1 0-3.84-3.1-6.9-7.16-6.9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="9.4" cy="10.4" r="1.5" fill="currentColor" />
          <circle cx="14.6" cy="10.4" r="1.5" fill="currentColor" />
          <path d="M10.6 14.6h2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <path d="M12 2.4V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 19V21.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2.4 12H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M19 12H21.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M12 3 4.8 5.6v5.4c0 4.6 3 8.2 7.2 9.6 4.2-1.4 7.2-5 7.2-9.6V5.6L12 3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "mapPin":
      return (
        <svg {...common}>
          <path
            d="M12 21.4s6.8-6.16 6.8-11.2A6.8 6.8 0 0 0 5.2 10.2c0 5.04 6.8 11.2 6.8 11.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10.1" r="2.3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path
            d="M9 5.5 15.5 12 9 18.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5.2" y="10.4" width="13.6" height="10" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="14.8" r="1.3" fill="currentColor" />
          <path d="M12 16.1V18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path
            d="M12 2.6 14.6 9l6.8.5-5.2 4.4 1.7 6.6L12 17l-5.9 3.5 1.7-6.6-5.2-4.4L9.4 9 12 2.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "swords":
      return (
        <svg {...common}>
          <path
            d="M4 4 11 11M4 4v4.4L9.4 14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 4 13 11M20 4v4.4L14.6 14"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 13.8 5 18v2h2l4.2-4.2M14.8 13.8 19 18v2h-2l-4.2-4.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "energy":
      return (
        <svg {...common}>
          <path d="M13 2.6 5.4 13.2h4.9L10 21.4l8.6-11.4h-5.2L13 2.6Z" fill="currentColor" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path
            d="M4.8 12.6 9.4 17.2 19.2 6.8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15.6 15.6 20.4 20.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="8.1" r="1.15" fill="currentColor" />
          <path d="M12 11.2V16.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="4.2" y="10" width="15.6" height="9.6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M4.2 13.4H19.8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 10V19.6" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 10C12 10 9.6 5.8 7.2 6.6C5.2 7.3 6.2 10 12 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M12 10C12 10 14.4 5.8 16.8 6.6C18.8 7.3 17.8 10 12 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path
            d="M5 12a7 7 0 0 1 11.7-5.2M19 12a7 7 0 0 1-11.7 5.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path d="M16.2 4.6 16.9 7.8 13.7 8.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.8 19.4 7.1 16.2 10.3 15.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "medicalCross":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 8V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.4V12L15.2 14.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 20.2s-7.6-4.66-7.6-10.2A4.6 4.6 0 0 1 12 6.8 4.6 4.6 0 0 1 19.6 10c0 5.54-7.6 10.2-7.6 10.2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path
            d="M14.7 9.3a3.6 3.6 0 0 1-4.53 4.53L5.4 18.6a1.6 1.6 0 0 1-2.26-2.26l4.83-4.83A3.6 3.6 0 0 1 12.5 6.98l-2.2 2.2 1.5 1.5 2.2-2.2c.4.24.66.5.7.82Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M13.2 13.2 17.6 17.6M15.4 15.4l2.9 2.9a1.4 1.4 0 0 0 2-2l-2.9-2.9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
