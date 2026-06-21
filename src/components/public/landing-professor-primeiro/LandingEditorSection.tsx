import Link from "next/link";
import { TeachyLessonPreview } from "@/components/public/landing/TeachyLessonPreview";
import { ppBtnPrimary, ppEyebrow } from "./theme";

const FLOW = ["IA gera o rascunho", "Você edita no painel", "Publica no Classroom"] as const;

export function LandingEditorSection() {
  return (
    <section id="editor" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <TeachyLessonPreview showCta={false} />
          </div>

          <div className="order-1 lg:order-2">
            <p className={ppEyebrow}>Editor integrado</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
              Gerou. Editou. Enviou.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Sem copiar para o Word ou perder formatação. O editor do Planify mantém a
              estrutura pedagógica enquanto você personaliza cada detalhe.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              {FLOW.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800">
                    {step}
                  </span>
                  {index < FLOW.length - 1 ? (
                    <span className="text-cyan-400" aria-hidden>
                      →
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <Link href="/editor-de-documentos-para-professores" className={`${ppBtnPrimary} mt-8 inline-flex`}>
              Conhecer o editor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
