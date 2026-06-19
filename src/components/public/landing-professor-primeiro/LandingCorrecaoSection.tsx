import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnSecondary, ppDarkBand, ppDarkBandTitle } from "./theme";

const STEPS = [
  {
    title: "Professor envia a atividade",
    description: "Foto, PDF ou texto da prova ou redação dos alunos.",
  },
  {
    title: "IA corrige e pontua",
    description: "Critérios claros, nota e devolutiva por competência.",
  },
  {
    title: "Relatório automático",
    description: "Visão da turma para reforço e feedback individual.",
  },
] as const;

export function LandingCorrecaoSection() {
  return (
    <section
      id="correcao"
      className={`${ppDarkBand} scroll-mt-24 border-y border-slate-200/80 bg-gradient-to-br from-slate-900 via-[#0c2a3a] to-[#071018] px-5 py-16 text-white sm:px-8 sm:py-24`}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Correção com IA</p>
          <h2 className={`${ppDarkBandTitle} mt-3 text-3xl sm:text-4xl`}>
            Corrija provas e atividades em segundos
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-cyan-100/80">
            Envie as respostas dos alunos e receba correção estruturada, feedback pedagógico
            e relatório da turma — sem noites em pilha de prova.
          </p>

          <div className="mt-8 space-y-5">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-sm font-black text-cyan-200 ring-1 ring-cyan-400/30">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold !text-white">{step.title}</p>
                  <p className="mt-1 text-sm font-medium text-cyan-100/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/correcao" className={`${ppBtnSecondary} mt-8 inline-flex border-white/20 bg-white/10 text-white hover:bg-white/20`}>
            Conhecer correção com IA
          </Link>
        </div>

        <div className="pf-demo-mock p-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                Correção · 9º ano
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">Prova de Ciências — Biomas</p>
            </div>
            <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-700 ring-1 ring-emerald-200">
              9,2
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {["Questão 1 — Acertou conceitos de biodiversidade", "Questão 2 — Parcial: citar exemplos regionais", "Questão 3 — Excelente argumentação"].map(
              (line) => (
                <div
                  key={line}
                  className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                >
                  <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {line}
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
              Relatório da turma
            </p>
            <div className="mt-3 flex h-24 items-end gap-2">
              {[40, 65, 55, 80, 72, 90, 68].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-600 to-cyan-400"
                  style={{ height: `${h}%` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
