import Image from "next/image";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnSecondary, ppEyebrow } from "./theme";

const proofHighlights = [
  "Materiais mais claros para revisar",
  "Fluxo rápido do rascunho ao editor",
  "IA com foco pedagógico real",
] as const;

export function LandingTeacherProof() {
  return (
    <section
      id="depoimento-cristiane"
      className="border-b border-slate-200/80 bg-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mx-auto w-full max-w-md">
          <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-800">
              <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
              Feedback real
            </span>

            <div className="relative mx-auto mt-6 aspect-square w-full max-w-[320px] overflow-hidden rounded-full border border-white bg-slate-100 shadow-xl shadow-cyan-950/10 ring-8 ring-cyan-50">
              <Image
                src="/depoimentos/cristiane-guimaraes.png"
                alt="Foto de perfil da professora Cristiane Guimarães"
                fill
                sizes="(min-width: 1024px) 320px, 72vw"
                className="object-cover object-[50%_48%]"
              />
            </div>

            <div className="mt-6 text-center">
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-slate-900">
                Cristiane Guimarães
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Professora de Letras, Português, Espanhol, Redação e Escrita Criativa
              </p>
              <p className="mt-1 text-sm font-bold text-cyan-700">
                Pós-graduada em Neuropsicopedagogia
              </p>
            </div>
          </article>
        </div>

        <div>
          <p className={ppEyebrow}>Prova social de professora</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Quem vive sala de aula percebe quando a ferramenta ajuda de verdade.
          </h2>
          <p className="mt-5 text-base font-medium leading-8 text-slate-600 sm:text-lg">
            O retorno da professora Cristiane reforça a promessa do Planify: criar atividades,
            avaliações e materiais editáveis com mais qualidade, velocidade e segurança pedagógica,
            mantendo o professor no controle da revisão final.
          </p>

          <div className="mt-8 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-800">
              Síntese do feedback
            </p>
            <p className="mt-3 text-xl font-extrabold leading-8 text-slate-900 sm:text-2xl">
              Ferramentas inteligentes que economizam tempo, organizam o material e elevam a
              qualidade do resultado entregue ao aluno.
            </p>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {proofHighlights.map((item) => (
              <li
                key={item}
                className="flex min-h-[72px] items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-5 text-slate-700 shadow-sm"
              >
                <PlanifyIcon name="spark" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href="/#ferramentas" className={ppBtnSecondary}>
              Ver ferramentas
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
