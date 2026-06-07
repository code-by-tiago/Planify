import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { institutionalPlans } from "@/lib/public/escolasCommercial";
import { EscolasContactForm } from "./EscolasContactForm";
import { EscolasPlanActions } from "./EscolasPlanActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planify para Escolas | Gestão Pedagógica e Conformidade BNCC",
  description:
    "Plataforma institucional para gestores escolares: controle pedagógico, conformidade com a BNCC, auditoria atualizada automaticamente e portal exclusivo para diretores e coordenadores.",
};

const benefits = [
  {
    icon: "listChecks" as const,
    title: "Auditoria Pedagógica Contínua",
    description:
      "Monitore habilidades da BNCC por turma, identifique lacunas pedagógicas e antecipe atrasos antes que impactem o calendário letivo.",
  },
  {
    icon: "clipboard" as const,
    title: "Gestão de Equipe Eficiente",
    description:
      "Acompanhe a produtividade docente, quais materiais didáticos foram aplicados e o andamento dos planejamentos em um único painel executivo.",
  },
  {
    icon: "lock" as const,
    title: "Autonomia de Acessos",
    description:
      "Portal exclusivo para diretores e gestores. Convide ou revogue licenças da equipe por e-mail em um clique.",
  },
];

const comparisonRows = [
  { label: "Portal exclusivo do gestor", values: [true, true, true] },
  { label: "Painel BNCC por turma", values: [true, true, true] },
  { label: "Painel de conformidade BNCC", values: [true, true, true] },
  { label: "Licenciamento por e-mail", values: [true, true, true] },
  { label: "Feed de materiais + alertas de lacunas BNCC", values: [false, true, true] },
  { label: "Métricas de produtividade docente", values: [false, true, true] },
  { label: "Onboarding institucional assistido", values: [false, true, true] },
  { label: "Acordo comercial personalizado", values: [false, false, true] },
  { label: "Implementação e treinamento dedicado", values: [false, false, true] },
];

export default function EscolasPage() {
  return (
    <main className="planify-hud planify-ui3 planify-public planify-hud-landing flex min-h-screen flex-col overflow-x-clip bg-white">
      <PublicHeader active="escolas" />

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
            Solução institucional Planify
          </p>
          <h1 className="pl-display mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem]">
            O controle pedagógico e a conformidade com a BNCC da sua escola em um único{" "}
            <span className="pl-hud-gradient-text">painel inteligente</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-600">
            O Planify automatiza a burocracia docente — planejamentos, materiais e registros
            pedagógicos — e entrega relatórios atualizados automaticamente no painel à coordenação e à direção. Sua
            equipe ganha produtividade; sua gestão ganha visibilidade, conformidade e
            tranquilidade institucional.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contato"
              className="pl-btn-brand inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-slate-900"
            >
              Solicitar uma Demonstração Gratuita
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </a>
            <Link
              href="/login?portal=escola"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800"
            >
              Acessar Portal da Escola
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {[
              "Conformidade BNCC",
              "Relatórios executivos",
              "Licenças institucionais",
              "Suporte comercial dedicado",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900"
              >
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </ul>
        </div>
      </section>

      {/* Benefícios para o Gestor */}
      <section className="border-y border-slate-200/80 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              Benefícios para o Gestor
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Visibilidade pedagógica{" "}
              <span className="pl-hud-gradient-text">sem aumentar a carga operacional</span>
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Ferramentas corporativas pensadas para diretores, mantenedores e coordenadores
              pedagógicos de escolas privadas que exigem rigor, previsibilidade e conformidade
              curricular.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <PlanifyIcon name={item.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm font-medium leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Planos Institucionais */}
      <section id="planos" className="scroll-mt-28 mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
            Planos Institucionais
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Investimento anual{" "}
            <span className="pl-hud-gradient-text">conforme o porte da instituição</span>
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Planos corporativos com licenciamento por professor, portal do gestor e suporte
            comercial dedicado. Valores anuais em reais — proposta formal mediante contato com
            nossa equipe.
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
          {institutionalPlans.map((plan) => (
            <article
              key={plan.key}
              className={`relative flex h-full flex-col rounded-2xl border p-7 transition hover:shadow-md ${
                plan.highlighted
                  ? "border-cyan-300 bg-white shadow-md ring-2 ring-cyan-500/20 lg:scale-[1.02]"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute right-6 top-6 rounded-lg bg-cyan-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  Recomendado
                </span>
              ) : null}

              <p className="pr-24 text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                {plan.name}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">{plan.teacherLimit}</p>

              <div className="mt-5 flex flex-wrap items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-950">
                  {plan.priceLabel}
                </span>
                <span className="pb-1.5 text-sm font-semibold text-slate-500">
                  {plan.priceNote}
                </span>
              </div>

              <p className="mt-5 text-sm font-medium leading-6 text-slate-600">
                {plan.description}
              </p>

              <ul className="mt-6 grid flex-1 gap-3 text-sm font-medium leading-6 text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <PlanifyIcon
                      name="checkCircle"
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <EscolasPlanActions planName={plan.name} highlighted={plan.highlighted} />
            </article>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Recurso institucional
                  </th>
                  {institutionalPlans.map((plan) => (
                    <th
                      key={plan.key}
                      className={`px-6 py-5 text-sm font-black ${
                        plan.highlighted ? "text-cyan-700" : "text-slate-700"
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.label}</td>
                    {row.values.map((included, index) => (
                      <td key={index} className="px-6 py-4">
                        {included ? (
                          <PlanifyIcon name="checkCircle" className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 bg-slate-50/50">
                  <td className="px-6 py-5 text-sm font-bold text-slate-700">Contato comercial</td>
                  {institutionalPlans.map((plan) => (
                    <td key={plan.key} className="px-6 py-5">
                      <a
                        href="#contato"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-700 hover:text-cyan-900"
                      >
                        Falar com Consultor
                        <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-5 pb-4 sm:px-8">
        <div className="pl-hud-cta-band rounded-2xl px-8 py-10 text-center sm:px-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/90">
            Próximo passo institucional
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Transforme a gestão pedagógica da sua escola
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-300">
            Agende uma demonstração gratuita com nossa equipe comercial. Apresentaremos o
            portal do gestor, o painel BNCC e as opções de licenciamento para o porte da sua
            instituição.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="#contato"
              className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold"
            >
              Solicitar Demonstração Gratuita
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </a>
            <Link
              href="/login?portal=escola"
              className="pl-hud-btn-ghost inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition"
            >
              Portal da Escola
            </Link>
          </div>
        </div>
      </section>

      <EscolasContactForm />

      <PublicFooter />
    </main>
  );
}
