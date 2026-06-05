import { type ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "slate";

type PlanifyBadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
  slate: "bg-slate-950 text-white",
};

const sizeClasses = {
  sm: "rounded-full px-2 py-0.5 text-[10px]",
  md: "rounded-full px-3 py-1 text-xs",
};

export function PlanifyBadge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: PlanifyBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-black uppercase tracking-[0.12em]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge (com ponto indicador)
// ---------------------------------------------------------------------------

type StatusVariant = "active" | "inactive" | "pending" | "error";

type PlanifyStatusBadgeProps = {
  status: StatusVariant;
  label?: string;
};

const statusConfig: Record<
  StatusVariant,
  { dot: string; text: string; label: string }
> = {
  active: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Ativo" },
  inactive: { dot: "bg-slate-400", text: "text-slate-500", label: "Inativo" },
  pending: { dot: "bg-amber-500", text: "text-amber-700", label: "Pendente" },
  error: { dot: "bg-red-500", text: "text-red-700", label: "Erro" },
};

export function PlanifyStatusBadge({ status, label }: PlanifyStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
      <span
        className={[
          "inline-block h-2 w-2 rounded-full",
          config.dot,
        ].join(" ")}
      />
      <span className={["text-xs font-black", config.text].join(" ")}>
        {label ?? config.label}
      </span>
    </span>
  );
}
