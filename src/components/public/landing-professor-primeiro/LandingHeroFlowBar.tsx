import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

const FLOW_STEPS = [
  {
    id: "conteudos",
    label: "Conteúdos",
    description: "Informe o que vai ensinar",
    icon: "fileText" as PlanifyIconName,
    iconClass: "text-[#3B82F6] bg-blue-50",
  },
  {
    id: "bncc",
    label: "BNCC",
    description: "Selecionamos as habilidades ideais",
    icon: "checkCircle" as PlanifyIconName,
    iconClass: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "planejamento",
    label: "Planejamento",
    description: "Geramos seu planejamento",
    icon: "calendar" as PlanifyIconName,
    iconClass: "text-violet-600 bg-violet-50",
  },
  {
    id: "editor",
    label: "Editor",
    description: "Edite e personalize como quiser",
    icon: "editor" as PlanifyIconName,
    iconClass: "text-orange-500 bg-orange-50",
  },
  {
    id: "classroom",
    label: "Classroom",
    description: "Envie para sua turma",
    icon: "externalLink" as PlanifyIconName,
    iconClass: "text-emerald-600 bg-emerald-50",
  },
] as const;

export function LandingHeroFlowBar() {
  return (
    <div
      className="pf-hero-flow-bar"
      aria-label="Fluxo do Planify: conteúdos, BNCC, planejamento, editor e Classroom"
    >
      {FLOW_STEPS.map((step, index) => (
        <div key={step.id} className="pf-hero-flow-step">
          {index > 0 ? (
            <span className="pf-hero-flow-arrow" aria-hidden>
              →
            </span>
          ) : null}
          <div className="pf-hero-flow-step-inner">
            <span className={`pf-hero-flow-icon ${step.iconClass}`}>
              <PlanifyIcon name={step.icon} className="h-4 w-4" />
            </span>
            <span className="pf-hero-flow-text">
              <span className="pf-hero-flow-label">{step.label}</span>
              <span className="pf-hero-flow-desc">{step.description}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
