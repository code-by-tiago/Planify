import Link from "next/link";

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  metric?: string;
  accent?: string;
};

export function FeatureCard({
  title,
  description,
  href,
  icon,
  badge,
  metric,
  accent = "from-cyan-300/25 to-violet-600/20",
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/40 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.09]"
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${accent} opacity-70 blur-2xl transition group-hover:opacity-100`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950/70 text-sm font-black text-cyan-100 ring-1 ring-white/10">
          {icon}
        </div>

        {badge && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
            {badge}
          </span>
        )}
      </div>

      <div className="relative">
        <h3 className="mt-6 text-xl font-black tracking-tight text-white">
          {title}
        </h3>

        <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="text-xs font-bold text-slate-500">{metric}</span>
          <span className="text-sm font-black text-cyan-200 transition group-hover:translate-x-1">
            Abrir →
          </span>
        </div>
      </div>
    </Link>
  );
}