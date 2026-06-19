import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { ppBtnSecondary, ppEyebrow } from "./theme";

type EcosystemCard = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  icon: PlanifyIconName;
  href: string;
  featured?: boolean;
};

const CARDS: EcosystemCard[] = [
  {
    id: "professores",
    title: "Professores",
    description:
      "Planeje, crie, corrija e exporte sem alternar entre dezenas de ferramentas — foco total no docente.",
    bullets: [
      "Planejamentos BNCC",
      "Materiais e avaliações",
      "Correção com IA",
      "Exportação Google",
    ],
    icon: "user",
    href: "/cadastro",
    featured: true,
  },
  {
    id: "escolas",
    title: "Escolas & gestores",
    description:
      "Padronize planejamentos, acompanhe equipes e reduza retrabalho com modelos oficiais e dados acionáveis.",
    bullets: [
      "Modelos oficiais DOCX",
      "Gestão de equipes",
      "Consistência pedagógica",
      "Redução de custos",
    ],
    icon: "clipboard",
    href: "/escolas",
  },
];

export function LandingEcosystem() {
  return (
    <section className="pf-marketing-ecosystem border-y border-slate-100 bg-slate-50/60 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className={ppEyebrow}>Em um ambiente integrado</p>
          <h2 className="pf-headline mt-3 text-3xl sm:text-4xl">
            Toda a sua rotina.
            <br />
            <span className="text-cyan-600">Um ecossistema.</span>
          </h2>
          <p className="mt-4 text-sm font-medium leading-7 text-slate-600 sm:text-base">
            Planify é professor-only — sem portal de alunos ou famílias. Tudo pensado para quem
            planeja, ensina e avalia em sala.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {CARDS.map((card) => (
            <article
              key={card.id}
              className={`flex flex-col rounded-3xl border p-6 sm:p-8 ${
                card.featured
                  ? "border-cyan-200 bg-white shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-100"
                  : "border-slate-200/80 bg-white shadow-sm"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  card.featured
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <PlanifyIcon name={card.icon} className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {card.description}
              </p>

              <ul className="mt-5 space-y-2" role="list">
                {card.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <PlanifyIcon name="checkCircle" className="h-4 w-4 shrink-0 text-cyan-600" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <Link
                href={card.href}
                className={`${ppBtnSecondary} mt-6 inline-flex w-fit gap-2`}
              >
                Saiba mais
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
