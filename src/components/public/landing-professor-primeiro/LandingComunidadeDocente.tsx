import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnPrimary, ppEyebrow } from "./theme";

const FEED_ITEMS = [
  {
    author: "Ana Paula · História",
    title: "Sequência didática: Revolução Industrial",
    tag: "8º ano",
    likes: 24,
  },
  {
    author: "Carlos Mendes · Matemática",
    title: "Lista de exercícios — equações do 1º grau",
    tag: "9º ano",
    likes: 18,
  },
  {
    author: "Juliana Rocha · Ciências",
    title: "Projeto interdisciplinar: sustentabilidade",
    tag: "6º ano",
    likes: 31,
  },
] as const;

export function LandingComunidadeDocente() {
  return (
    <section id="comunidade" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className={ppEyebrow}>Comunidade docente</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
              Você não precisa ensinar sozinho.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Compartilhe materiais, troque experiências e descubra o que outros professores
              estão usando em sala — uma rede feita por quem vive a educação.
            </p>

            <ul className="mt-8 space-y-3 text-sm font-semibold text-slate-700" role="list">
              <li className="flex items-center gap-2">
                <PlanifyIcon name="checkCircle" className="h-4 w-4 text-cyan-600" />
                Compartilhamento de materiais prontos
              </li>
              <li className="flex items-center gap-2">
                <PlanifyIcon name="checkCircle" className="h-4 w-4 text-cyan-600" />
                Troca de experiências entre disciplinas
              </li>
              <li className="flex items-center gap-2">
                <PlanifyIcon name="checkCircle" className="h-4 w-4 text-cyan-600" />
                Professores conectados em tempo real
              </li>
            </ul>

            <Link href="/comunidade" className={`${ppBtnPrimary} mt-8 inline-flex`}>
              Conhecer comunidade
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <p className="text-sm font-extrabold text-slate-900">Feed da comunidade</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                128 online
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {FEED_ITEMS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-cyan-200 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                      {item.author.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500">{item.author}</p>
                      <p className="mt-1 text-sm font-extrabold text-slate-900">{item.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                          {item.tag}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          ♥ {item.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
