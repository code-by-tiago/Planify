import Link from "next/link";

const mainTools = [
  {
    title: "Planejamentos",
    subtitle: "Anual e trimestral",
    description:
      "Crie planejamentos pedagógicos com organização por conteúdos, habilidades, aulas e avaliação.",
    href: "/planejamentos",
    tag: "Gerar",
  },
  {
    title: "Materiais",
    subtitle: "Atividades, provas e apostilas",
    description:
      "Produza materiais didáticos com IA, revise no editor e baixe em documento editável.",
    href: "/materiais",
    tag: "Criar",
  },
  {
    title: "Editor",
    subtitle: "Revisão e organização",
    description:
      "Abra documentos gerados, ajuste textos e prepare versões finais para uso pedagógico.",
    href: "/editor",
    tag: "Editar",
  },
  {
    title: "Histórico",
    subtitle: "Documentos recentes",
    description:
      "Acesse materiais e planejamentos salvos para continuar editando quando precisar.",
    href: "/historico",
    tag: "Abrir",
  },
];

const extraAreas = [
  {
    title: "Biblioteca Premium",
    description:
      "Acervo de materiais oficiais cadastrados e organizados pela administração.",
    href: "/biblioteca",
  },
  {
    title: "Marketplace",
    description:
      "Espaço para professores compartilharem, anexarem e baixarem materiais pedagógicos.",
    href: "/marketplace",
  },
  {
    title: "Planos",
    description:
      "Visualize assinatura mensal, anual e acesso premium do Planify.",
    href: "/planos",
  },
  {
    title: "Admin",
    description:
      "Painel do dono do site para gestão geral da plataforma.",
    href: "/admin",
  },
];

const qualityCards = [
  ["Organização", "Fluxos pensados para a rotina real do professor."],
  ["Produtividade", "Geração rápida, edição simples e download em documento."],
  ["Padrão", "Materiais estruturados com linguagem profissional."],
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.5rem] border border-cyan-300/20 bg-cyan-300/10 p-8 shadow-2xl shadow-cyan-500/10">
            <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-300">
              Painel premium
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              Seu ambiente de produção pedagógica.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-cyan-100/80">
              Organize planejamentos, crie materiais didáticos, revise documentos
              no editor e acesse recursos premium em um só lugar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/planejamentos"
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Criar planejamento
              </Link>

              <Link
                href="/materiais"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                Gerar material
              </Link>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
            <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-300">
              Acesso
            </p>

            <h2 className="mt-5 text-3xl font-black text-white">
              Premium ativo
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Sua conta está liberada para usar os recursos do Planify:
              planejamentos, materiais didáticos, editor, histórico, biblioteca
              e marketplace.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                ["Planejamentos", "Anual e trimestral"],
                ["Materiais", "Atividades e avaliações"],
                ["Editor", "Revisão e finalização"],
                ["Biblioteca", "Acervo pedagógico"],
              ].map(([title, subtitle]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                >
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-300">
                Ferramentas
              </p>
              <h2 className="mt-4 text-4xl font-black text-white">
                Comece pelo que você precisa hoje
              </h2>
            </div>

            <Link
              href="/historico"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ver histórico
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {mainTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      {tool.subtitle}
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-white">
                      {tool.title}
                    </h3>
                  </div>

                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                    {tool.tag}
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  {tool.description}
                </p>

                <p className="mt-6 text-sm font-black text-cyan-200 transition group-hover:translate-x-1">
                  Acessar →
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-cyan-300">
            Gestão, biblioteca e comunidade
          </p>

          <h2 className="mt-4 text-4xl font-black text-white">
            Outras áreas do Planify
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {extraAreas.map((area) => (
              <Link
                key={area.title}
                href={area.href}
                className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                <h3 className="text-xl font-black text-white">{area.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {area.description}
                </p>
                <p className="mt-5 text-sm font-black text-cyan-200">
                  Abrir área →
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[2.5rem] border border-emerald-300/20 bg-emerald-300/10 p-8 shadow-2xl shadow-emerald-500/10">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-emerald-300">
            Status
          </p>

          <h2 className="mt-4 text-4xl font-black text-white">
            Acesso premium liberado
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-emerald-100/85">
            Seu painel está pronto para criar, editar, organizar e baixar
            documentos pedagógicos com qualidade profissional.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {qualityCards.map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-5"
              >
                <p className="text-lg font-black text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
