import Link from "next/link";
import type { ProductPageContent } from "../lib/navigation";
import { PageShell } from "./PageShell";
import { PageHero } from "./PageHero";
import { SectionHeader } from "./SectionHeader";
import { InfoCard } from "./InfoCard";

type ProductPageProps = {
  content: ProductPageContent;
};

export function ProductPage({ content }: ProductPageProps) {
  return (
    <PageShell>
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryLabel={content.primaryAction}
        primaryHref="#area"
        secondaryLabel={content.secondaryAction}
        secondaryHref={content.href}
      />

      <section id="area" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl lg:sticky lg:top-28 lg:h-fit">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Módulo
            </p>
            <h2 className="mt-4 text-3xl font-black text-white">
              {content.panelTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {content.panelDescription}
            </p>

            <div className="mt-7 grid gap-3">
              {content.panelItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                >
                  <span className="text-sm font-bold text-slate-200">{item}</span>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                    Área
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
            >
              Voltar ao dashboard
            </Link>
          </aside>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-3">
              {content.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-slate-950/20"
                >
                  <p className="text-sm font-black text-white">{highlight}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Planify</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6">
              {content.features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl transition hover:border-cyan-300/30 hover:bg-white/[0.08]"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-600/20 text-sm font-black text-cyan-100 ring-1 ring-white/10">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-2xl">
              <SectionHeader
                align="left"
                eyebrow="Fluxo"
                title="Processo de trabalho"
                description="Uma sequência objetiva para manter o módulo organizado e produtivo."
              />

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {content.workflow.map((item, index) => (
                  <InfoCard key={item.title} title={item.title} description={item.description}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-sm font-black text-cyan-200">
                      {index + 1}
                    </div>
                  </InfoCard>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </PageShell>
  );
}