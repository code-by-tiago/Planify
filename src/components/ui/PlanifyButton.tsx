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
    "bg-[var(--pl-sun)] text-[var(--pl-navy)] shadow-lg shadow-[var(--pl-sun)]/20 hover:-translate-y-0.5 hover:bg-[var(--pl-sun-light)] active:translate-y-0",
  secondary:
    "border border-[var(--pl-border-teal)] bg-white text-[var(--pl-navy-soft)] hover:border-[var(--pl-teal)] hover:text-[var(--pl-navy)]",
  ghost:
    "text-[#5b6f75] hover:bg-[var(--pl-surface-teal)] hover:text-[var(--pl-navy)]",
  danger:
    "bg-[#f26d5b] text-white shadow-lg shadow-[#f26d5b]/20 hover:-translate-y-0.5 hover:bg-[#df5948] active:translate-y-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-2 text-xs",
  md: "rounded-lg px-4 py-2.5 text-sm",
  lg: "rounded-lg px-5 py-3 text-sm",
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
