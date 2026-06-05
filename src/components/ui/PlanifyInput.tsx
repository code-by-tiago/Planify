import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

const baseInput =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

type PlanifyLabelProps = {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
};

export function PlanifyLabel({ children, required, htmlFor }: PlanifyLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-black text-slate-700"
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

type PlanifyInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const PlanifyInput = forwardRef<HTMLInputElement, PlanifyInputProps>(
  function PlanifyInput({ label, hint, error, className = "", id, ...rest }, ref) {
    return (
      <div className="w-full">
        {label && (
          <PlanifyLabel htmlFor={id} required={rest.required}>
            {label}
          </PlanifyLabel>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            baseInput,
            error ? "border-red-400 focus:border-red-500" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {error && (
          <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs font-semibold text-slate-400">{hint}</p>
        )}
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

type PlanifyTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const PlanifyTextarea = forwardRef<
  HTMLTextAreaElement,
  PlanifyTextareaProps
>(function PlanifyTextarea(
  { label, hint, error, className = "", id, ...rest },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <PlanifyLabel htmlFor={id} required={rest.required}>
          {label}
        </PlanifyLabel>
      )}
      <textarea
        ref={ref}
        id={id}
        className={[
          baseInput,
          "resize-none leading-6",
          error ? "border-red-400 focus:border-red-500" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs font-semibold text-slate-400">{hint}</p>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

type PlanifySelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export const PlanifySelect = forwardRef<
  HTMLSelectElement,
  PlanifySelectProps
>(function PlanifySelect(
  { label, hint, error, className = "", id, children, ...rest },
  ref,
) {
  return (
    <div className="w-full">
      {label && (
        <PlanifyLabel htmlFor={id} required={rest.required}>
          {label}
        </PlanifyLabel>
      )}
      <select
        ref={ref}
        id={id}
        className={[
          baseInput,
          "cursor-pointer appearance-none",
          error ? "border-red-400 focus:border-red-500" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs font-semibold text-slate-400">{hint}</p>
      )}
    </div>
  );
});
