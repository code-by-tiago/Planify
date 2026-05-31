import { ButtonLink } from "./ButtonLink";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: PageHeroProps) {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200 shadow-2xl shadow-cyan-500/10">
            {eyebrow}
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
            {title}
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            {description}
          </p>

          {(primaryLabel || secondaryLabel) && (
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              {primaryLabel && primaryHref && (
                <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
              )}

              {secondaryLabel && secondaryHref && (
                <ButtonLink href={secondaryHref} variant="secondary">
                  {secondaryLabel}
                </ButtonLink>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-violet-600/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl sm:p-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-black text-white">Ambiente do professor</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Organização, produção e gestão pedagógica
                  </p>
                </div>
                <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                  Premium
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  ["Planejamentos", "Anual e trimestral"],
                  ["Materiais", "Atividades e avaliações"],
                  ["Editor", "Revisão e organização"],
                  ["Biblioteca", "Acervo pedagógico"],
                ].map(([title, subtitle]) => (
                  <div
                    key={title}
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
                  >
                    <div>
                      <span className="text-sm font-black text-slate-100">{title}</span>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
                    </div>
                    <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                      Planify
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {["Clareza", "Velocidade", "Padrão"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-center">
                    <p className="text-sm font-black text-white">{item}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Premium</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}