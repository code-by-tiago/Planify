import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type BrandProps = {
  href?: string;
  compact?: boolean;
  dark?: boolean;
};

export function PlanifyBrand({
  href = "/dashboard",
  compact = false,
  dark = false,
}: BrandProps) {
  const content = (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          dark ? "bg-white text-slate-950" : "bg-slate-950 text-white"
        }`}
      >
        <PlanifyIcon name="spark" className="h-5 w-5" />
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
          <p
            className={`mt-1 text-xs font-bold uppercase tracking-[0.18em] ${
              dark ? "text-slate-300" : "text-slate-400"
            }`}
          >
            Studio
          </p>
        </div>
      ) : null}
    </div>
  );

  return <Link href={href}>{content}</Link>;
}
