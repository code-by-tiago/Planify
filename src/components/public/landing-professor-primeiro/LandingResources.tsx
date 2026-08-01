import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
<<<<<<< HEAD
import { GoogleClassroomIcon } from "@/components/google/GoogleClassroomIcon";
import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { RESOURCES } from "./constants";
=======
import { GoogleDriveIcon } from "@/components/google/GoogleDriveIcon";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { RESOURCES } from "./constants";
import { ppEyebrow } from "./theme";
>>>>>>> origin/aplicar-melhorias-na-producao

const GOOGLE_RESOURCE_ICONS = {
  "Exportação Google": GoogleDriveIcon,
} as const;

export function LandingResources() {
  return (
<<<<<<< HEAD
    <section id="recursos" className="scroll-mt-24 bg-slate-50/80 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
=======
    <section id="recursos" className="scroll-mt-24 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Recursos</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#0A192F] sm:text-4xl">
>>>>>>> origin/aplicar-melhorias-na-producao
            Recursos que fazem a diferença
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Tudo o que você precisa para planejar, criar e entregar materiais de qualidade.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCES.map((resource) => {
            const GoogleIcon =
              resource.title in GOOGLE_RESOURCE_ICONS
                ? GOOGLE_RESOURCE_ICONS[resource.title as keyof typeof GOOGLE_RESOURCE_ICONS]
                : null;

            return (
<<<<<<< HEAD
            <article
              key={resource.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100">
                {GoogleIcon ? (
                  <GoogleIcon className="h-6 w-6" />
                ) : (
                  <PlanifyIcon name={resource.icon as PlanifyIconName} className="h-5 w-5" />
                )}
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">{resource.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                {resource.description}
              </p>
            </article>
            );
          })}
        </div>
=======
              <article
                key={resource.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F9FA] text-[#26C6DA]">
                  {GoogleIcon ? (
                    <GoogleIcon className="h-6 w-6" />
                  ) : (
                    <PlanifyIcon name={resource.icon as PlanifyIconName} className="h-5 w-5" />
                  )}
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-[#0A192F]">{resource.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {resource.description}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-2 text-center text-sm font-medium text-slate-600">
          <PlanifyIcon name="shieldCheck" className="h-4 w-4 shrink-0 text-slate-500" />
          Seus documentos vão direto para o Google Drive e Docs da sua própria conta. Nada fica
          retido nos nossos servidores.
        </p>
>>>>>>> origin/aplicar-melhorias-na-producao
      </div>
    </section>
  );
}
