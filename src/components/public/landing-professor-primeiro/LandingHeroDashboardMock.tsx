import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

const SIDEBAR_ITEMS: { label: string; icon: PlanifyIconName; active?: boolean }[] = [
  { label: "Início", icon: "home", active: true },
  { label: "Planejamento", icon: "clipboard" },
  { label: "Materiais", icon: "layers" },
  { label: "Editor", icon: "editor" },
  { label: "Correção IA", icon: "pen" },
  { label: "Biblioteca", icon: "library" },
  { label: "Comunidade", icon: "market" },
  { label: "Marketplace", icon: "market" },
  { label: "Histórico", icon: "history" },
];

const START_CARDS = [
  { label: "Planejamento Anual", icon: "clipboard" as PlanifyIconName, color: "text-blue-600 bg-blue-50" },
  { label: "Planejamento Trimestral", icon: "calendar" as PlanifyIconName, color: "text-violet-600 bg-violet-50" },
  { label: "Novo Material", icon: "layers" as PlanifyIconName, color: "text-emerald-600 bg-emerald-50" },
  { label: "Abrir Editor", icon: "editor" as PlanifyIconName, color: "text-orange-500 bg-orange-50" },
  { label: "Correção com IA", icon: "pen" as PlanifyIconName, color: "text-rose-600 bg-rose-50" },
];

const RECENT_PLANS = [
  { title: "Língua Portuguesa · 8º Ano", tag: "Anual", tagClass: "bg-blue-100 text-blue-700" },
  { title: "Matemática · 6º Ano", tag: "Trimestral", tagClass: "bg-emerald-100 text-emerald-700" },
];

const RECENT_MATERIALS = [
  { title: "Atividade de Frações", tag: "Material", tagClass: "bg-violet-100 text-violet-700" },
  { title: "Prova de Ciências", tag: "Prova", tagClass: "bg-orange-100 text-orange-700" },
];

export function LandingHeroDashboardMock() {
  return (
    <div className="pf-hero-dashboard-mock" aria-hidden>
      <div className="pf-hero-dashboard-window">
        <aside className="pf-hero-dashboard-sidebar">
          <div className="pf-hero-dashboard-sidebar-brand">
            <PlanifyBrand href="/" dark compact hideTagline />
          </div>
          <nav className="pf-hero-dashboard-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`pf-hero-dashboard-nav-item ${item.active ? "is-active" : ""}`}
              >
                <PlanifyIcon name={item.icon} className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="pf-hero-dashboard-sidebar-help">
            <PlanifyIcon name="infoCircle" className="h-3.5 w-3.5" />
            <span>Ajuda</span>
          </div>
        </aside>

        <div className="pf-hero-dashboard-main">
          <div className="pf-hero-dashboard-header">
            <div>
              <h3 className="pf-hero-dashboard-greeting">Olá, Professor! 👋</h3>
              <p className="pf-hero-dashboard-subgreeting">
                Pronto para transformar seu planejamento hoje?
              </p>
            </div>
            <span className="pf-hero-dashboard-cta-btn">
              <PlanifyIcon name="plus" className="h-3 w-3" />
              Novo planejamento
            </span>
          </div>

          <p className="pf-hero-dashboard-section-label">Comece por aqui</p>
          <div className="pf-hero-dashboard-start-row">
            {START_CARDS.map((card) => (
              <div key={card.label} className="pf-hero-dashboard-start-card">
                <span className={`pf-hero-dashboard-start-icon ${card.color}`}>
                  <PlanifyIcon name={card.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="pf-hero-dashboard-start-label">{card.label}</span>
              </div>
            ))}
          </div>

          <div className="pf-hero-dashboard-bottom-grid">
            <div className="pf-hero-dashboard-lists">
              <div className="pf-hero-dashboard-list-block">
                <p className="pf-hero-dashboard-list-title">Seus últimos planejamentos</p>
                {RECENT_PLANS.map((item) => (
                  <div key={item.title} className="pf-hero-dashboard-list-item">
                    <span className="pf-hero-dashboard-list-text">{item.title}</span>
                    <span className={`pf-hero-dashboard-tag ${item.tagClass}`}>{item.tag}</span>
                  </div>
                ))}
              </div>
              <div className="pf-hero-dashboard-list-block">
                <p className="pf-hero-dashboard-list-title">Materiais recentes</p>
                {RECENT_MATERIALS.map((item) => (
                  <div key={item.title} className="pf-hero-dashboard-list-item">
                    <span className="pf-hero-dashboard-list-text">{item.title}</span>
                    <span className={`pf-hero-dashboard-tag ${item.tagClass}`}>{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pf-hero-dashboard-classroom-card">
              <div className="pf-hero-dashboard-classroom-icon">
                <PlanifyIcon name="externalLink" className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="pf-hero-dashboard-classroom-title">Google Classroom</p>
              <p className="pf-hero-dashboard-classroom-desc">
                Envie para o Google Classroom em um clique
              </p>
              <span className="pf-hero-dashboard-classroom-btn">Conectar Classroom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
