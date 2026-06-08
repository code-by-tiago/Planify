import { SCHOOL_PARTNERS } from "./constants";
import { ppEyebrow } from "./theme";

export function LandingSchoolLogos() {
  return (
    <section className="border-y border-slate-200/80 bg-white px-5 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <p className={`${ppEyebrow} text-center`}>Escolas que confiam</p>
        <h2 className="mt-3 text-center font-[family-name:var(--font-display)] text-xl font-extrabold text-slate-900 sm:text-2xl">
          Educadores e instituições em todo o Brasil
        </h2>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {SCHOOL_PARTNERS.map((school) => (
            <div
              key={school.name}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 transition hover:border-cyan-200 hover:bg-cyan-50/30"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${school.color} text-xs font-extrabold text-white shadow-sm ring-2 ring-white`}
                aria-hidden
              >
                {school.initials}
              </span>
              <span className="text-sm font-bold text-slate-700">{school.name}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          Nomes ilustrativos — representam o perfil de escolas parceiras.
        </p>
      </div>
    </section>
  );
}
