import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type LandingHomeLinkProps = {
  className?: string;
  compact?: boolean;
};

/** Volta para a landing pública (/) — usado no painel e páginas internas */
export function LandingHomeLink({
  className = "",
  compact = false,
}: LandingHomeLinkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-slate-50 hover:text-slate-950 ${className}`}
    >
      <PlanifyIcon name="home" className="h-3.5 w-3.5 text-blue-600" />
      {compact ? "Site" : "Página inicial"}
    </Link>
  );
}
