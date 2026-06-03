import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyTools } from "@/lib/pro/planifyTools";

const featuredTools = planifyTools.filter((tool) => tool.popular).slice(0, 6);

const heroProof = [
  "Geração com IA",
  "Alinhado à BNCC",
  "Exportação em DOCX oficial",
];

const steps: { title: string; description: string; icon: PlanifyIconName }[] = [
  {
    title: "Escolha a ferramenta",
    description:
      "Selecione planejamento, material, prova, slides ou jogo no painel central.",
    icon: "materials",
  },
  {
    title: "Descreva o contexto",
    description:
      "Informe etapa, ano, componente e tema. A IA estrutura o conteúdo pedagógico.",
    icon: "spark",
  },
  {
    title: "Revise no editor",
    description:
      "Ajuste o resultado no editor integrado e mantenha tudo organizado no histórico.",
    icon: "editor",
  },
  {
    title: "Exporte e aplique",
    description:
      "Baixe em DOCX oficial pronto para a escola ou compartilhe na sua biblioteca.",
    icon: "download",
  },
];

const differentials: {
  title: string;
  description: string;
  icon: PlanifyIconName;
}[] = [
  {
    title: "Inteligência artificial",
    description:
      "Geração assistida por IA para planejamentos, materiais, avaliações e atividades.",
    icon: "spark",
  },
  {
    title: "Alinhamento à BNCC",
    description:
      "Habilidades e competências sugeridas conforme a Base Nacional Comum Curricular.",
    icon: "checkCircle",
  },
  {
    title: "DOCX oficial",
    description:
      "Documentos formais prontos para impressão e arquivamento, no padrão da escola.",
    icon: "fileText",
  },
  {
    title: "Editor integrado",
    description:
      "Revise e personalize cada material gerado sem sair da plataforma.",
    icon: "editor",
  },
  {
    title: "Histórico organizado",
    description:
      "Acesse, reabra e reaproveite tudo o que foi criado em um só lugar.",
    icon: "history",
  },
  {
    title: "Biblioteca premium",
    description:
      "Modelos e recursos pedagógicos selecionados para acelerar a preparação.",
    icon: "library",
  },
  {
    title: "Marketplace pedagógico",
    description:
      "Descubra e compartilhe materiais entre professores da comunidade.",
    icon: "market",
  },
];

export default function HomePage() {
  return (
    <main className="planify-ui3 min-h-screen">
      <PublicHeader active="home" />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
        <div className="planify-hero__content">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            <PlanifyIcon name="spark" className="h-4 w-4" />
            Plataforma educacional premium
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Planejamentos e materiais com padrão profissional, em minutos.
          </h1>

          <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-slate-600">
            O Planify reúne inteligência artificial, alinhamento à BNCC e
            exportação em DOCX oficial para que professores criem aulas,
            avaliações e atividades com qualidade e rapidez.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5"
            >
              Acessar painel
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
            >
              Ver planos
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {heroProof.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600"
              >
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Preview do painel */}
        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between gap-4 rounded-[1.6rem] bg-gradient-to-br from-slate-950 to-slate-800 px-5 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">
                Painel do professor
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight text-white">
                Criação rápida
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <PlanifyIcon name="spark" className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {featuredTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-[1.3rem] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <PlanifyIcon name={tool.icon} className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-black leading-tight text-slate-950">
                  {tool.shortTitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ferramentas principais */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            Ferramentas
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Tudo o que o professor precisa para preparar e avaliar.
          </h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
            Geradores compactos e diretos para o dia a dia escolar, com
            resultados prontos para revisar e exportar.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <div
              key={tool.id}
              className="group rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-slate-950 group-hover:text-white">
                <PlanifyIcon name={tool.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Como funciona
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Do tema ao documento final em quatro passos.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                    <PlanifyIcon name={step.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-black tracking-tight text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            Diferenciais
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Uma plataforma completa, do planejamento à publicação.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <PlanifyIcon name={item.icon} className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="overflow-hidden rounded-[2.25rem] border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-800 p-8 shadow-xl sm:p-12">
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
              Comece agora
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Eleve o padrão das suas aulas com o Planify.
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
              Escolha um plano e libere todos os geradores, o editor, o histórico
              e a biblioteca premium.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              Ver planos
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              Entrar na conta
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
