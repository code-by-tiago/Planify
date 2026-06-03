import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyCard, PlanifyCardHeader, PlanifyStatCard } from "@/components/ui/PlanifyCard";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import { TeachyLessonPreview } from "@/components/public/landing/TeachyLessonPreview";
import {
  appNavigation,
  planifyTools,
  toolCategories,
} from "@/lib/pro/planifyTools";
import { teachyHomeFeatures } from "@/lib/pro/teachyLanding";

const faqItems = [
  {
    question: "Preciso saber usar inteligência artificial?",
    answer:
      "Não. Descreva o tema, etapa e componente em português — o Planify estrutura o material pedagógico para você revisar.",
  },
  {
    question: "Os materiais seguem a BNCC?",
    answer:
      "Sim. Habilidades e competências são sugeridas conforme etapa, ano/série e componente curricular.",
  },
  {
    question: "Onde ficam minhas ferramentas?",
    answer:
      "Todas as 13 ferramentas abrem no mesmo painel (/dashboard), organizadas por categoria na barra lateral — igual às páginas internas.",
  },
  {
    question: "Como exporto os materiais?",
    answer:
      "Em DOCX oficial, pelo editor integrado. Tudo também fica no histórico para reaproveitar.",
  },
  {
    question: "Como começo?",
    answer:
      "Crie sua conta, acesse o painel e escolha um plano para liberar os geradores premium.",
  },
];

const stats = [
  { label: "Ferramentas IA", value: "13", icon: "spark" as const },
  { label: "Alinhamento", value: "BNCC", icon: "checkCircle" as const },
  { label: "Exportação", value: "DOCX", icon: "download" as const },
  { label: "Fluxo único", value: "1 painel", icon: "layers" as const },
];

export function PlanifyHomePage() {
  const toolsByCategory = toolCategories
    .filter((c) => c.id !== "todos")
    .map((cat) => ({
      ...cat,
      tools: planifyTools.filter((t) => t.category === cat.id),
    }));

  return (
    <>
      {/* Hero */}
      <section
        id="inicio"
        className="scroll-mt-28 border-b border-indigo-100/60 pl-app-bg"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Planify · IA pedagógica
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl">
              Materiais de aula com IA,{" "}
              <span className="pl-gradient-text">alinhados à BNCC.</span>
            </h1>
            <p className="mt-6 text-lg font-semibold leading-8 text-slate-600">
              Um painel único para planejar, gerar, editar e exportar — com as
              mesmas cores, organização e ferramentas que você usa logado na
              plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="pl-btn-brand">
                Acessar o painel
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
              <Link href="/login" className="pl-btn-secondary">
                Entrar
              </Link>
            </div>
          </div>
          <TeachyLessonPreview variant="hero" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-4 px-5 pb-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {stats.map((s) => (
            <PlanifyStatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={<PlanifyIcon name={s.icon} className="h-5 w-5" />}
            />
          ))}
        </div>
      </section>

      {/* Painel / workspace — espelha sidebar interna */}
      <section id="painel" className="scroll-mt-28 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <PlanifyCardHeader
            eyebrow="Navegação"
            title="Tudo no mesmo painel Planify"
            description="As áreas abaixo são as mesmas do menu lateral quando você está logado. Um clique e você continua de onde parou."
            icon={<PlanifyIcon name="home" className="h-5 w-5" />}
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {appNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 p-5 transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md">
                  <PlanifyIcon name={item.icon} className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500 group-hover:text-indigo-600">
                    Abrir →
                  </span>
                </span>
              </Link>
            ))}
            <Link
              href="/planejamentos"
              className="group flex items-center gap-4 rounded-[1.5rem] border border-fuchsia-200/80 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 transition hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-400 text-white shadow-md">
                <PlanifyIcon name="layers" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-slate-950">
                  Construtor de aula
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-violet-600">
                  Aula completa em um fluxo →
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ferramentas por categoria */}
      <section
        id="ferramentas"
        className="scroll-mt-28 border-y border-indigo-100/50 pl-app-bg py-16 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <PlanifyCardHeader
            eyebrow="13 geradores"
            title="Ferramentas organizadas por categoria"
            description="Cada card abre direto no painel, na ferramenta certa — mesma lista da barra lateral interna."
            action={
              <Link href="/dashboard" className="pl-btn-brand text-sm">
                Ver no painel
              </Link>
            }
          />

          <div className="mt-10 space-y-12">
            {toolsByCategory.map((group) => (
              <div key={group.id}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                    <PlanifyIcon name={group.icon} className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">
                      {group.label}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      {group.tools.length}{" "}
                      {group.tools.length === 1 ? "ferramenta" : "ferramentas"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="group flex h-full flex-col rounded-[1.5rem] border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                        >
                          <PlanifyIcon name={tool.icon} className="h-4 w-4" />
                        </span>
                        {tool.popular ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
                            Popular
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-3 text-sm font-black text-slate-950">
                        {tool.title}
                      </h4>
                      <p className="mt-1 flex-1 text-xs font-semibold leading-5 text-slate-500">
                        {tool.description}
                      </p>
                      <span className="mt-3 text-xs font-bold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                        Abrir no painel →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-28 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <PlanifyCardHeader
            eyebrow="Fluxo"
            title="Do tema ao DOCX em quatro passos"
            description="Informações e cards alinhados ao que você vê dentro do Planify."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {teachyHomeFeatures.map((step, i) => (
              <PlanifyCard key={step.title} className="h-full">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <PlanifyIcon name={step.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-1 text-base font-black text-slate-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {step.description}
                    </p>
                    <Link
                      href={step.href}
                      className="mt-3 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {step.cta} →
                    </Link>
                  </div>
                </div>
              </PlanifyCard>
            ))}
          </div>
        </div>
      </section>

      {/* Planos CTA */}
      <section id="planos" className="scroll-mt-28 pl-app-bg py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <PlanifyCard className="border-indigo-100 bg-white/90 text-center">
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
              Libere todos os geradores com um plano
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-600">
              Créditos claros, checkout seguro e acesso premium ao mesmo painel
              que você conheceu aqui.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/planos" className="pl-btn-brand">
                Ver planos
              </Link>
              <Link href="/login" className="pl-btn-secondary">
                Criar conta
              </Link>
            </div>
          </PlanifyCard>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 bg-white py-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-black text-slate-950">
            Perguntas frequentes
          </h2>
          <div className="mt-8">
            <LandingFaq items={faqItems} />
          </div>
        </div>
      </section>
    </>
  );
}
