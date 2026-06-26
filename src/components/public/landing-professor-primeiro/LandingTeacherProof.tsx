import Image from "next/image";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { ppBtnSecondary, ppEyebrow } from "./theme";

const proofHighlights = [
  "Resultados mais bem organizados",
  "Criação com menos retrabalho",
  "Revisão final sempre com o professor",
] as const;

export function LandingTeacherProof() {
  return (
    <section
      id="recursos"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Feedback de professora</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Ferramentas que ajudam o professor a entregar melhor, mais rápido.
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            A experiência da professora Helena Lopes reforça o foco do Planify: transformar ideias
            em materiais claros, revisáveis e prontos para adaptar à realidade da turma.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[440px]">
            <Image
              src="/depoimentos/helena-lopes.jpg"
              alt="Professora Helena Lopes com materiais pedagógicos"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover object-[50%_44%]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/82 via-slate-950/38 to-transparent p-6 pt-20 text-white">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-100">
                Helena Lopes
              </p>
              <p className="mt-2 max-w-md text-2xl font-extrabold leading-tight">
                Professora usando IA para ganhar tempo sem abrir mão da curadoria pedagógica.
              </p>
            </div>
          </div>

          <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-800">
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                Prova social
              </span>

              <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                Helena Lopes
              </h3>
              <p className="mt-2 text-sm font-bold text-cyan-700">Professora</p>

              <div className="mt-8 border-l-4 border-cyan-400 bg-cyan-50/70 py-4 pl-5 pr-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-800">
                  Síntese do feedback
                </p>
                <p className="mt-3 text-xl font-extrabold leading-8 text-slate-900">
                  O Planify acelera a criação, organiza o raciocínio didático e entrega um material
                  que o professor consegue revisar, adaptar e usar com confiança.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <ul className="grid gap-3">
                {proofHighlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-bold leading-5 text-slate-700"
                  >
                    <PlanifyIcon name="spark" className="h-4 w-4 shrink-0 text-cyan-600" />
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
          </article>
        </div>
      </div>
    </section>
  );
}
