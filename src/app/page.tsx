import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { Reveal } from "@/components/public/landing/Reveal";
import { HeroShowcase } from "@/components/public/landing/HeroShowcase";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyTools } from "@/lib/pro/planifyTools";

const featuredTools = planifyTools.filter((tool) => tool.popular).slice(0, 6);
const showcaseTools = featuredTools.map((tool) => ({
  id: tool.id,
  shortTitle: tool.shortTitle,
  icon: tool.icon,
}));

const heroProof = [
  "Geração com IA",
  "Alinhado à BNCC",
  "Exportação em DOCX oficial",
];

const heroStats: { value: string; label: string }[] = [
  { value: "13", label: "ferramentas pedagógicas" },
  { value: "BNCC", label: "alinhamento garantido" },
  { value: "min", label: "do tema ao material" },
];

const trustTags = [
  "Matemática",
  "Língua Portuguesa",
  "Ciências",
  "História",
  "Geografia",
  "Ed. Infantil",
  "Ensino Fundamental",
  "Ensino Médio",
  "Física",
  "Química",
  "Biologia",
  "Artes",
  "Inglês",
  "Educação Física",
];

const stats: { value: string; label: string; icon: PlanifyIconName }[] = [
  { value: "13", label: "Ferramentas com IA em um só lugar", icon: "spark" },
  { value: "100%", label: "Conteúdo alinhado à BNCC", icon: "checkCircle" },
  { value: "DOCX", label: "Exportação oficial pronta para imprimir", icon: "fileText" },
  { value: "1 fluxo", label: "Do planejamento à sala de aula", icon: "layers" },
];

const steps: { title: string; description: string; icon: PlanifyIconName }[] = [
  {
    title: "Escolha a ferramenta",
    description:
      "Selecione plano de aula, prova, slides, jogo ou qualquer um dos 13 geradores.",
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
      "Ajuste textos, questões e estrutura no editor integrado, com total controle.",
    icon: "editor",
  },
  {
    title: "Exporte e aplique",
    description:
      "Baixe em DOCX oficial pronto para a escola ou guarde na sua biblioteca.",
    icon: "download",
  },
];

const platformFlow: { title: string; description: string; icon: PlanifyIconName }[] = [
  {
    title: "Crie o material",
    description: "Escolha a ferramenta e gere conteúdo sob medida para a turma.",
    icon: "materials",
  },
  {
    title: "Refine no editor",
    description: "Ajuste textos, questões e estrutura com total controle.",
    icon: "editor",
  },
  {
    title: "Organize o histórico",
    description: "Reabra e reaproveite cada material quando precisar.",
    icon: "history",
  },
  {
    title: "Exporte e aplique",
    description: "Baixe em DOCX oficial pronto para a sala de aula.",
    icon: "download",
  },
];

const benefits: { title: string; description: string; icon: PlanifyIconName }[] = [
  {
    title: "Recupere seus fins de semana",
    description:
      "O que levava horas de preparação acontece em minutos. Mais tempo para ensinar, menos para formatar.",
    icon: "spark",
  },
  {
    title: "Nunca comece do zero",
    description:
      "Tudo o que você cria fica salvo no histórico, pronto para reabrir, adaptar e reutilizar.",
    icon: "history",
  },
  {
    title: "Confiança pedagógica",
    description:
      "Habilidades e competências sugeridas conforme a BNCC, prontas para apresentar à coordenação.",
    icon: "checkCircle",
  },
  {
    title: "Pronto para a sala",
    description:
      "Documentos em DOCX oficial, com a formatação certa para imprimir e aplicar na escola.",
    icon: "fileText",
  },
];

const testimonials: {
  quote: string;
  name: string;
  role: string;
  initials: string;
}[] = [
  {
    quote:
      "Montei uma sequência didática completa e alinhada à BNCC em poucos minutos. O que eu fazia no domingo à noite agora resolvo no intervalo.",
    name: "Mariana Souza",
    role: "Professora de Ciências · Ensino Fundamental",
    initials: "MS",
  },
  {
    quote:
      "As provas saem com gabarito e já no padrão da escola. O editor me deixa ajustar tudo antes de exportar em DOCX. Virou parte da minha rotina.",
    name: "Rafael Lima",
    role: "Professor de Matemática · Ensino Médio",
    initials: "RL",
  },
  {
    quote:
      "Uso para slides, atividades e jogos. Os alunos perceberam a diferença e eu finalmente parei de levar trabalho para casa.",
    name: "Patrícia Andrade",
    role: "Professora Polivalente · Anos Iniciais",
    initials: "PA",
  },
];

const faqItems = [
  {
    question: "Preciso saber usar inteligência artificial?",
    answer:
      "Não. Você descreve o que precisa em português, do seu jeito, e o Planify estrutura o material pedagógico. Sem comandos técnicos nem configuração complicada.",
  },
  {
    question: "Os materiais seguem a BNCC?",
    answer:
      "Sim. O Planify sugere habilidades e competências conforme a Base Nacional Comum Curricular, considerando a etapa, o ano/série e o componente informados.",
  },
  {
    question: "Posso editar o que a IA gera?",
    answer:
      "Sempre. Todo material abre no editor integrado, onde você ajusta textos, questões e estrutura antes de exportar. Você mantém o controle do conteúdo final.",
  },
  {
    question: "Em que formato eu exporto?",
    answer:
      "Em DOCX oficial, com formatação pronta para impressão e arquivamento no padrão da escola. Tudo também fica salvo no seu histórico para reaproveitar.",
  },
  {
    question: "Para quais etapas de ensino o Planify funciona?",
    answer:
      "Da Educação Infantil ao Ensino Médio, em todos os componentes curriculares. Você informa a etapa e o ano/série e o conteúdo é adaptado ao contexto.",
  },
  {
    question: "Como faço para começar?",
    answer:
      "Acesse o painel para conhecer as ferramentas e escolha um plano para liberar os geradores, o editor, o histórico e a biblioteca premium.",
  },
];

export default function HomePage() {
  return (
    <main className="planify-ui3 min-h-screen overflow-x-clip">
      <PublicHeader active="home" />

      {/* Hero */}
      <section className="pl-aurora relative">
        <div className="pl-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <Reveal from="left">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur">
              <PlanifyIcon name="spark" className="h-4 w-4" />
              Plataforma educacional com IA
            </span>

            <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Aulas, provas e materiais incríveis{" "}
              <span className="pl-gradient-text">em minutos</span> — e seus fins
              de semana de volta.
            </h1>

            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-slate-600">
              O Planify reúne inteligência artificial, alinhamento à BNCC e
              exportação em DOCX oficial para que professores criem, editem e
              organizem tudo com qualidade profissional.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Começar agora
                <PlanifyIcon
                  name="arrowRight"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/planos"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 text-sm font-black text-slate-700 backdrop-blur transition hover:border-slate-950 hover:text-slate-950"
              >
                Ver planos
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {heroProof.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-black text-slate-600 backdrop-blur"
                >
                  <PlanifyIcon
                    name="checkCircle"
                    className="h-3.5 w-3.5 text-emerald-600"
                  />
                  {item}
                </span>
              ))}
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-200 pt-7">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <HeroShowcase tools={showcaseTools} />
        </div>
      </section>

      {/* Faixa de confiança */}
      <section className="border-y border-slate-200 bg-white/60 py-7">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Feito para todos os componentes e etapas da educação básica
          </p>
          <div className="pl-marquee mt-5">
            <div className="pl-marquee__track gap-3">
              {[...trustTags, ...trustTags].map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600"
                >
                  <PlanifyIcon name="book" className="h-4 w-4 text-indigo-500" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08}>
              <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <PlanifyIcon name={stat.icon} className="h-5 w-5" />
                </span>
                <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Ferramentas principais */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Ferramentas
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tudo o que o professor precisa para preparar e avaliar.
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              Geradores diretos e objetivos para o dia a dia escolar, com
              resultados prontos para revisar e exportar.
            </p>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.map((tool, index) => (
            <Reveal key={tool.id} delay={index * 0.06}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-slate-950 group-hover:text-white">
                  <PlanifyIcon name={tool.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {tool.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-indigo-700 opacity-0 transition group-hover:opacity-100">
                  Usar ferramenta
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
          >
            Ver todas as 13 ferramentas
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <Reveal>
            <div className="max-w-2xl">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
                Como funciona
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Do tema ao documento final em quatro passos.
              </h2>
            </div>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.08}>
                <div className="relative h-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-200 hover:bg-white hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-700 shadow-sm">
                      <PlanifyIcon name={step.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-2xl font-black text-slate-200">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Plataforma completa */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal from="left">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Plataforma completa
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Do planejamento à exportação, em um só fluxo.
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
              O Planify integra criação, edição, histórico e exportação para que
              o professor mantenha tudo organizado, sem alternar entre
              ferramentas.
            </p>

            <div className="mt-7 grid gap-3">
              {platformFlow.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <PlanifyIcon name={step.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950">
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-sm font-semibold leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Mockup de documento gerado */}
          <Reveal from="right">
            <div className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-slate-100 to-indigo-50 p-4 shadow-lg">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-200" />
                    <span className="h-3 w-3 rounded-full bg-amber-200" />
                    <span className="h-3 w-3 rounded-full bg-emerald-200" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    DOCX oficial
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                  <div className="h-3 w-full rounded-full bg-slate-100" />
                  <div className="h-3 w-11/12 rounded-full bg-slate-100" />
                  <div className="h-3 w-5/6 rounded-full bg-slate-100" />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {["Objetivos", "Atividades", "Avaliação"].map((label) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
                    <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
                    Abrir no editor
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700">
                    <PlanifyIcon name="download" className="h-3.5 w-3.5" />
                    Exportar
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Por que professores escolhem o Planify
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Menos trabalho manual. Mais tempo para ensinar.
            </h2>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {benefits.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.07}>
              <div className="flex h-full gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <PlanifyIcon name={item.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Quem usa, recomenda
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Professores que recuperaram o tempo deles.
            </h2>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 0.08}>
              <figure className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={star} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm font-semibold leading-7 text-slate-700">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {item.role}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Perguntas frequentes
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tudo o que você precisa saber.
            </h2>
          </div>
        </Reveal>

        <div className="mt-9">
          <LandingFaq items={faqItems} />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <Reveal>
          <div className="pl-aurora relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 shadow-2xl sm:p-14">
            <div className="relative max-w-2xl">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">
                Comece agora
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Eleve o padrão das suas aulas com o Planify.
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-300">
                Escolha um plano e libere todos os geradores, o editor, o
                histórico e a biblioteca premium.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/planos"
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                >
                  Ver planos
                  <PlanifyIcon
                    name="arrowRight"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Entrar na conta
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <PublicFooter />
    </main>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2.5l2.7 5.86 6.3.66-4.7 4.32 1.3 6.26L12 16.9l-5.6 3.7 1.3-6.26-4.7-4.32 6.3-.66L12 2.5z" />
    </svg>
  );
}
