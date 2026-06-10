import { GoogleProductIcon } from "@/components/google/GoogleProductIcon";
import type { GoogleProduct } from "@/components/google/GoogleProductIcon";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { GOOGLE_EXPORT_PRODUCTS } from "./constants";
import { ppEyebrow } from "./theme";

const productAccent: Record<GoogleProduct, string> = {
  drive: "from-emerald-500 to-teal-600",
  docs: "from-blue-500 to-indigo-600",
  slides: "from-amber-400 to-orange-500",
  forms: "from-violet-500 to-purple-600",
  classroom: "from-green-500 to-emerald-600",
};

export function LandingGoogleExport() {
  return (
    <section
      id="exportacao-google"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Exportação Google</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Do editor à turma em um clique
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Conecte sua conta Google uma vez e exporte direto do painel — sem baixar, reenviar ou
            refazer formatação manual.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GOOGLE_EXPORT_PRODUCTS.map((item) => (
            <article
              key={item.product}
              className="pl-hud-glass group flex flex-col rounded-2xl border border-cyan-400/15 p-5 transition hover:border-cyan-300/40"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${productAccent[item.product]} shadow-sm`}
              >
                <GoogleProductIcon product={item.product} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}

          <article className="pl-hud-glass flex flex-col justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-50/80 to-cyan-50/60 p-5 sm:col-span-2 lg:col-span-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-200">
              <PlanifyIcon name="checkCircle" className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-extrabold text-slate-900">OAuth em um passo</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Na primeira exportação, autorize o Google. Depois disso, Drive, Docs, Slides, Forms e
              Classroom ficam disponíveis com um clique no editor ou na comunidade.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
