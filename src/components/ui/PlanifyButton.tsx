import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type PlanifyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white shadow-lg shadow-slate-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  danger:
    "bg-red-600 text-white shadow-lg shadow-red-100 hover:-translate-y-0.5 hover:bg-red-500 active:translate-y-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-xl px-3 py-2 text-xs",
  md: "rounded-2xl px-4 py-2.5 text-sm",
  lg: "rounded-2xl px-5 py-3 text-sm",
};

export const PlanifyButton = forwardRef<
  HTMLButtonElement,
  PlanifyButtonProps
>(function PlanifyButton(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    className = "",
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-black transition",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
