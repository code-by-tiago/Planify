import type { ReactNode } from "react";

type InfoCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function InfoCard({ title, description, children }: InfoCardProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl transition hover:border-cyan-300/30 hover:bg-white/[0.08]">
      <h3 className="text-xl font-black text-white">{title}</h3>
      {description && <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </article>
  );
}