import Link from "next/link";
import { LumiMascot } from "@/components/pro/LumiMascot";

type BrandProps = {
  href?: string;
  compact?: boolean;
  dark?: boolean;
  /** Oculta o subtítulo (útil em espaços estreitos) */
  hideTagline?: boolean;
};

export function PlanifyBrand({
  href = "/dashboard",
  compact = false,
  dark = false,
  hideTagline = false,
}: BrandProps) {
  const content = (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          dark
            ? "bg-white/10 ring-1 ring-white/15"
            : "bg-gradient-to-br from-indigo-50 via-white to-rose-50 ring-1 ring-indigo-100"
        }`}
      >
        <LumiMascot size={38} priority />
      </div>
      {!compact ? (
        <div>
          <p
            className={`text-lg font-black leading-none tracking-tight ${
              dark ? "text-white" : "text-slate-950"
            }`}
          >
            Planify
          </p>
          {!hideTagline ? (
            <p
              className={`mt-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                dark ? "text-slate-300" : "text-indigo-500"
              }`}
            >
              IA pedagógica · BNCC
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return <Link href={href}>{content}</Link>;
}
