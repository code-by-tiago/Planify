import { type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Card base
// ---------------------------------------------------------------------------

type PlanifyCardProps = {
  children: ReactNode;
  className?: string;
  /** Padding interno padrão ou nenhum (para controle total do conteúdo) */
  noPadding?: boolean;
};

export function PlanifyCard({ children, className = "", noPadding = false }: PlanifyCardProps) {
  return (
    <div
      className={[
        "rounded-[2rem] border border-slate-200 bg-white shadow-sm",
        noPadding ? "" : "p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card header (seção de topo com eyebrow + título)
// ---------------------------------------------------------------------------

type CardHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function PlanifyCardHeader({
  eyebrow,
  title,
  description,
  action,
  icon,
}: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool card (card compacto para catálogo de ferramentas)
// ---------------------------------------------------------------------------

type ToolCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
  href?: string;
};

export function PlanifyToolCard({
  icon,
  title,
  description,
  badge,
  onClick,
}: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[148px] w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-xl"
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
          {badge}
        </span>
      )}
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-black leading-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Stat card (card de número/métrica)
// ---------------------------------------------------------------------------

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
};

export function PlanifyStatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      {trend && (
        <p className="mt-1 text-xs font-bold text-slate-500">{trend}</p>
      )}
    </div>
  );
}
