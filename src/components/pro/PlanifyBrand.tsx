import Link from "next/link";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";

type BrandProps = {
  href?: string;
  compact?: boolean;
  dark?: boolean;
  hideTagline?: boolean;
};

export function PlanifyBrand({
  href = "/",
  compact = false,
  dark = false,
  hideTagline = false,
}: BrandProps) {
  const owlSize = compact ? 36 : 44;

  const content = (
    <div className="flex items-center gap-3">
      <PlanifyOwlMark size={owlSize} glow={!dark} priority />
      {!compact ? (
        <div>
          <p
            className={`text-xl font-extrabold leading-none tracking-tight ${
              dark ? "text-white" : "text-slate-950"
            }`}
          >
            Planify
          </p>
          {!hideTagline ? (
            <p
              className={`mt-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                dark ? "text-cyan-200/80" : "text-cyan-600"
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
