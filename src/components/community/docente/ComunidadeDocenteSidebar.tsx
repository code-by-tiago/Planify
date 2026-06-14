"use client";

import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  IconBookmark,
  IconCalendar,
  IconChat,
  IconFolder,
  IconGraduation,
  IconHome,
  IconTrophy,
  IconUsers,
  getDisciplinaIconColor,
} from "@/components/community/docente/docente-icons";
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-mock-data";
import type { DocenteDisciplina, DocenteMenuItem } from "@/lib/community/docente-types";

const MENU_ITEMS: { id: DocenteMenuItem; label: string; icon: typeof IconHome }[] = [
  { id: "inicio", label: "Início", icon: IconHome },
  { id: "discussoes", label: "Discussões", icon: IconChat },
  { id: "materiais", label: "Materiais", icon: IconFolder },
  { id: "eventos", label: "Eventos", icon: IconCalendar },
  { id: "grupos", label: "Grupos", icon: IconUsers },
  { id: "professores", label: "Professores", icon: IconGraduation },
  { id: "desafios", label: "Desafios", icon: IconTrophy },
  { id: "salvos", label: "Salvos", icon: IconBookmark },
];

type ComunidadeDocenteSidebarProps = {
  activeItem: DocenteMenuItem;
  selectedDisciplina: DocenteDisciplina | null;
  onSelectItem: (item: DocenteMenuItem) => void;
  onSelectDisciplina: (disciplina: DocenteDisciplina | null) => void;
  onClose?: () => void;
  className?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function ComunidadeDocenteSidebar({
  activeItem,
  selectedDisciplina,
  onSelectItem,
  onSelectDisciplina,
  onClose,
  className = "",
  collapsed = false,
  onToggleCollapsed,
}: ComunidadeDocenteSidebarProps) {
  return (
    <aside
      className={[
        "flex shrink-0 flex-col border-r border-slate-200/80 bg-white transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-[260px]",
        className,
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center border-b border-slate-100",
          collapsed ? "justify-center px-2 py-4" : "justify-between gap-2 px-4 py-4",
        ].join(" ")}
      >
        <PlanifyBrand href="/dashboard" hideTagline compact={collapsed} />
        {onToggleCollapsed && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Recolher menu da comunidade"
            title="Recolher menu"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:flex"
          >
            <PlanifyIcon name="chevronRight" className="h-4 w-4 rotate-180" />
          </button>
        ) : null}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeItem === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  title={collapsed ? label : undefined}
                  onClick={() => {
                    onSelectItem(id);
                    onClose?.();
                  }}
                  className={[
                    "flex w-full items-center rounded-xl py-2.5 text-left text-sm font-semibold transition",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                    active
                      ? "bg-cyan-50 text-[#0F172A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]",
                  ].join(" ")}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${active ? "text-cyan-500" : "text-slate-400"}`}
                  />
                  {!collapsed ? label : null}
                </button>
              </li>
            );
          })}
        </ul>

        {!collapsed ? (
          <div className="mt-8 px-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Canais por disciplina
            </p>
            <ul className="space-y-0.5">
              {DOCENTE_DISCIPLINAS.map((disciplina) => (
                <li key={disciplina}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDisciplina(selectedDisciplina === disciplina ? null : disciplina);
                      onSelectItem("materiais");
                      onClose?.();
                    }}
                    className={[
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-semibold transition",
                      selectedDisciplina === disciplina
                        ? "bg-cyan-50 text-cyan-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]",
                    ].join(" ")}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full bg-current ${getDisciplinaIconColor(disciplina)}`}
                    />
                    {disciplina}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDisciplina(null);
                    onSelectItem("materiais");
                    onClose?.();
                  }}
                  className="mt-1 px-2 text-xs font-bold text-cyan-600 hover:text-cyan-700"
                >
                  Ver todas
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-4 space-y-1 px-1">
            {DOCENTE_DISCIPLINAS.map((disciplina) => (
              <button
                key={disciplina}
                type="button"
                title={disciplina}
                onClick={() => {
                  onSelectDisciplina(selectedDisciplina === disciplina ? null : disciplina);
                  onSelectItem("materiais");
                  onClose?.();
                }}
                className={[
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition",
                  selectedDisciplina === disciplina
                    ? "bg-cyan-50 ring-2 ring-cyan-200"
                    : "hover:bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${getDisciplinaIconColor(disciplina)}`}
                />
              </button>
            ))}
          </div>
        )}
      </nav>

      {!collapsed ? (
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <IconTrophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">Participe dos desafios!</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                  Ganhe badges e destaque seus materiais na comunidade.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectItem("desafios")}
              className="mt-3 w-full rounded-xl bg-[#0F172A] px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Ver desafios
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            title="Ver desafios"
            onClick={() => onSelectItem("desafios")}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] text-white transition hover:bg-slate-800"
          >
            <IconTrophy className="h-4 w-4" />
          </button>
        </div>
      )}

      {onToggleCollapsed && collapsed ? (
        <div className="hidden border-t border-slate-100 p-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expandir menu da comunidade"
            title="Expandir menu"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <PlanifyIcon name="chevronRight" className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </aside>
  );
}
