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
  accent = "from-indigo-100 to-violet-100",
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
    >
      <div
        className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${accent} opacity-80`}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-sm">
          {icon}
        </div>
        {badge ? (
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-2 min-h-[4.5rem] text-sm font-medium leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold text-slate-400">{metric}</span>
          <span className="text-sm font-bold text-indigo-600 transition group-hover:translate-x-0.5">
            Abrir →
          </span>
        </div>
      </div>
    </Link>
  );
}
