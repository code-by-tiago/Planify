import type { PlanifyIconName } from "@/lib/pro/planifyTools";

type IconProps = {
  name: PlanifyIconName;
  className?: string;
};

function BaseIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || "h-5 w-5"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlanifyIcon({ name, className }: IconProps) {
  switch (name) {
    case "home":
      return (
        <BaseIcon className={className}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </BaseIcon>
      );
    case "materials":
      return (
        <BaseIcon className={className}>
          <path d="M4 5h16" />
          <path d="M4 12h16" />
          <path d="M4 19h16" />
          <path d="M7 5v14" />
          <path d="M17 5v14" />
        </BaseIcon>
      );
    case "calendar":
      return (
        <BaseIcon className={className}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M3 10h18" />
        </BaseIcon>
      );
    case "clipboard":
      return (
        <BaseIcon className={className}>
          <path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </BaseIcon>
      );
    case "presentation":
      return (
        <BaseIcon className={className}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M12 16v5" />
          <path d="M8 21h8" />
          <path d="m8 11 3-3 2 2 3-4" />
        </BaseIcon>
      );
    case "fileText":
      return (
        <BaseIcon className={className}>
          <path d="M6 3h8l4 4v14H6V3Z" />
          <path d="M14 3v5h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </BaseIcon>
      );
    case "listChecks":
      return (
        <BaseIcon className={className}>
          <path d="m4 7 2 2 4-4" />
          <path d="M13 7h7" />
          <path d="m4 15 2 2 4-4" />
          <path d="M13 15h7" />
        </BaseIcon>
      );
    case "book":
      return (
        <BaseIcon className={className}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
        </BaseIcon>
      );
    case "puzzle":
      return (
        <BaseIcon className={className}>
          <path d="M8 3h4v4h2a2 2 0 1 1 0 4h-2v3H9a2 2 0 1 0-4 0v3H3V7h5V3Z" />
          <path d="M12 14h3a2 2 0 1 1 0 4h-3v3H7v-4" />
        </BaseIcon>
      );
    case "layers":
      return (
        <BaseIcon className={className}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </BaseIcon>
      );
    case "project":
      return (
        <BaseIcon className={className}>
          <rect x="3" y="4" width="6" height="6" rx="1.5" />
          <rect x="15" y="4" width="6" height="6" rx="1.5" />
          <rect x="9" y="14" width="6" height="6" rx="1.5" />
          <path d="M9 7h6" />
          <path d="m8 10 3 4" />
          <path d="m16 10-3 4" />
        </BaseIcon>
      );
    case "cards":
      return (
        <BaseIcon className={className}>
          <rect x="6" y="5" width="12" height="16" rx="2" />
          <path d="M4 17V7a2 2 0 0 1 2-2" />
          <path d="M9 10h6" />
          <path d="M9 14h4" />
        </BaseIcon>
      );
    case "pen":
      return (
        <BaseIcon className={className}>
          <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
          <path d="m13 6 5 5" />
        </BaseIcon>
      );
    case "brain":
      return (
        <BaseIcon className={className}>
          <path d="M8 6a3 3 0 0 1 6-1 3 3 0 0 1 4 4 3 3 0 0 1 0 6 3 3 0 0 1-4 4 3 3 0 0 1-6-1 3 3 0 0 1-3-5 3 3 0 0 1 3-7Z" />
          <path d="M12 5v14" />
          <path d="M8 10h4" />
          <path d="M12 14h4" />
        </BaseIcon>
      );
    case "editor":
      return (
        <BaseIcon className={className}>
          <path d="M5 4h14v16H5V4Z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </BaseIcon>
      );
    case "history":
      return (
        <BaseIcon className={className}>
          <path d="M4 12a8 8 0 1 0 3-6.2" />
          <path d="M4 4v6h6" />
          <path d="M12 8v5l3 2" />
        </BaseIcon>
      );
    case "library":
      return (
        <BaseIcon className={className}>
          <path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2Z" />
          <path d="M8 7h6" />
          <path d="M8 11h6" />
        </BaseIcon>
      );
    case "market":
      return (
        <BaseIcon className={className}>
          <path d="M4 8h16l-1 12H5L4 8Z" />
          <path d="M8 8a4 4 0 0 1 8 0" />
          <path d="M9 13h6" />
        </BaseIcon>
      );
    case "plans":
      return (
        <BaseIcon className={className}>
          <path d="M12 3 3 9l9 12 9-12-9-6Z" />
          <path d="M3 9h18" />
          <path d="m8 9 4 12 4-12" />
        </BaseIcon>
      );
    case "admin":
      return (
        <BaseIcon className={className}>
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </BaseIcon>
      );
    case "search":
      return (
        <BaseIcon className={className}>
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 4 4" />
        </BaseIcon>
      );
    case "lock":
      return (
        <BaseIcon className={className}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </BaseIcon>
      );
    case "spark":
      return (
        <BaseIcon className={className}>
          <path d="M12 3v5" />
          <path d="M12 16v5" />
          <path d="M3 12h5" />
          <path d="M16 12h5" />
          <path d="m6 6 3 3" />
          <path d="m15 15 3 3" />
          <path d="m18 6-3 3" />
          <path d="m9 15-3 3" />
        </BaseIcon>
      );
    case "user":
      return (
        <BaseIcon className={className}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </BaseIcon>
      );
    case "arrowRight":
      return (
        <BaseIcon className={className}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </BaseIcon>
      );
    case "close":
      return (
        <BaseIcon className={className}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </BaseIcon>
      );
    default:
      return (
        <BaseIcon className={className}>
          <circle cx="12" cy="12" r="8" />
        </BaseIcon>
      );
  }
}
