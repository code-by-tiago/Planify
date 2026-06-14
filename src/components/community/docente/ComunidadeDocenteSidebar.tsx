"use client";

import { PlanifyBrand } from "@/components/pro/PlanifyBrand";
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
import type { DocenteMenuItem } from "@/lib/community/docente-types";

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
  onSelectItem: (item: DocenteMenuItem) => void;
  onClose?: () => void;
  className?: string;
};

export function ComunidadeDocenteSidebar({
  activeItem,
  onSelectItem,
  onClose,
  className = "",
}: ComunidadeDocenteSidebarProps) {
  return (
    <aside
      className={`flex w-[260px] shrink-0 flex-col border-r border-slate-200/80 bg-white ${className}`}
    >
      <div className="border-b border-slate-100 px-5 py-5">
        <PlanifyBrand href="/dashboard" hideTagline />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeItem === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectItem(id);
                    onClose?.();
                  }}
                  className={[
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                    active
                      ? "bg-cyan-50 text-[#0F172A]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]",
                  ].join(" ")}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${active ? "text-cyan-500" : "text-slate-400"}`}
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 px-2">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Canais por disciplina
          </p>
          <ul className="space-y-0.5">
            {DOCENTE_DISCIPLINAS.map((disciplina) => (
              <li key={disciplina}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-[#0F172A]"
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
                className="mt-1 px-2 text-xs font-bold text-cyan-600 hover:text-cyan-700"
              >
                Ver todas
              </button>
            </li>
          </ul>
        </div>
      </nav>

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
    </aside>
  );
}
