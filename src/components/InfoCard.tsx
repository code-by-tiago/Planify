import type { ReactNode } from "react";

type InfoCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function InfoCard({ title, description, children }: InfoCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}
