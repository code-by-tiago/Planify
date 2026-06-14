import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export function IconHome({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

export function IconChat({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12c0 3.866-3.582 7-8 7-.89 0-1.74-.13-2.53-.37L3 21l1.37-5.47A7.94 7.94 0 0 1 3 12c0-3.866 3.582-7 8-7s8 3.134 8 7Z" />
    </svg>
  );
}

export function IconFolder({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

export function IconCalendar({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function IconUsers({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 19v-1a3 3 0 0 0-2-2.83M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconGraduation({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 8.5 12 14l10-5.5L12 3ZM4 10.5V16c0 2 3.5 4 8 4s8-2 8-4v-5.5" />
    </svg>
  );
}

export function IconTrophy({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function IconBookmark({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-3-6 3V4Z" />
    </svg>
  );
}

export function IconSearch({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3-3" />
    </svg>
  );
}

export function IconBell({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9l-1-2H6a4 4 0 0 1 4-4v-.5a4 4 0 1 1 8 0V11a4 4 0 0 1 4 4h-2l-1 2ZM10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconMessage({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 21l1.8-6.2A8.96 8.96 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
    </svg>
  );
}

export function IconPlus({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} {...props}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconHeart({ className = "h-5 w-5", filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5s-7-4.35-7-10a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5c0 5.65-7 10-7 10Z" />
    </svg>
  );
}

export function IconComment({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h10M7 13h6M5 20l1.5-4.5H18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11.5L5 20Z" />
    </svg>
  );
}

export function IconShare({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z" />
    </svg>
  );
}

export function IconEye({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconMenu({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconChevronDown({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconArrowRight({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconX({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconUpload({ className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M8 8l4-4 4 4M4 20h16" />
    </svg>
  );
}

const DISCIPLINA_ICON_COLORS: Record<string, string> = {
  "Língua Portuguesa": "text-rose-500",
  Matemática: "text-blue-500",
  Ciências: "text-emerald-500",
  História: "text-amber-500",
  Geografia: "text-teal-500",
  Inglês: "text-indigo-500",
  Artes: "text-purple-500",
  "Educação Física": "text-orange-500",
};

export function getDisciplinaIconColor(disciplina: string): string {
  return DISCIPLINA_ICON_COLORS[disciplina] ?? "text-cyan-500";
}
