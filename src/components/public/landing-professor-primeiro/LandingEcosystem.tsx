"use client";

import { useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { ppBtnSecondary } from "./theme";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCards = CARDS.slice(activeIndex, activeIndex + 2);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex + 2 < CARDS.length;

  return (
    <section id="perfis" className="pf-marketing-ecosystem pf-marketing-section scroll-mt-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="pf-marketing-display pf-marketing-display--section max-w-3xl">
            Conheça mais por perfil
          </h2>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Perfil anterior"
              disabled={!canPrev}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="pf-marketing-carousel-btn"
            >
              <PlanifyIcon name="arrowLeft" className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próximo perfil"
              disabled={!canNext}
              onClick={() => setActiveIndex((i) => Math.min(CARDS.length - 2, i + 1))}
              className="pf-marketing-carousel-btn"
            >
              <PlanifyIcon name="arrowRight" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {visibleCards.map((card) => (
            <article
              key={card.id}
              className={`pf-marketing-eco-card ${card.featured ? "is-featured" : ""}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  card.featured
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <PlanifyIcon name={card.icon} className="h-6 w-6" />
              </span>

              <h3 className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">{card.title}</h3>
              <p className="mt-2 flex-1 text-sm font-normal leading-6 text-slate-600">
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

              <Link href={card.href} className={`${ppBtnSecondary} mt-6 inline-flex w-fit gap-2`}>
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
