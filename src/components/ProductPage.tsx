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

      <section id="area" className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:h-fit">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Módulo
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {content.panelTitle}
            </h2>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
              {content.panelDescription}
            </p>

            <div className="mt-6 grid gap-2">
              {content.panelItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <span className="text-sm font-bold text-slate-800">{item}</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700">
                    Área
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white hover:opacity-95"
            >
              Voltar ao painel
            </Link>
          </aside>

          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              {content.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-black text-slate-950">{highlight}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Planify</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              {content.features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-950">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-6">
              <SectionHeader
                align="left"
                eyebrow="Fluxo"
                title="Processo de trabalho"
                description="Uma sequência objetiva para manter o módulo organizado e produtivo."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {content.workflow.map((item, index) => (
                  <InfoCard
                    key={item.title}
                    title={item.title}
                    description={item.description}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700">
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
