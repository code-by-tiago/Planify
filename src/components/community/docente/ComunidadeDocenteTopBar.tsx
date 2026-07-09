"use client";

import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { CommunityNotificationsIcon } from "@/components/community/CommunityNotificationsIcon";
import {
  IconBookmark,
  IconGraduation,
  IconHome,
  IconPlus,
  IconSearch,
  IconTrophy,
} from "@/components/community/docente/docente-icons";
import type { DocenteMenuItem } from "@/lib/community/docente-types";

const NAV_ITEMS: { id: DocenteMenuItem; label: string; icon: typeof IconHome }[] = [
  { id: "inicio", label: "Início", icon: IconHome },
  { id: "professores", label: "Professores", icon: IconGraduation },
  { id: "desafios", label: "Desafios", icon: IconTrophy },
  { id: "salvos", label: "Salvos", icon: IconBookmark },
];

type ComunidadeDocenteTopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onCreatePost: () => void;
  onSelectMenu?: (item: DocenteMenuItem) => void;
  activeMenu?: DocenteMenuItem;
  initialOpenMessages?: boolean;
};

export function ComunidadeDocenteTopBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onCreatePost,
  onSelectMenu,
  activeMenu = "inicio",
  initialOpenMessages = false,
}: ComunidadeDocenteTopBarProps) {
  return (
    <header className="sticky top-0 z-30 grid h-14 shrink-0 grid-cols-[1fr_minmax(0,36rem)_1fr] items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      <div />

      <div className="relative mx-auto w-full min-w-0 max-w-xl">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSearchSubmit) {
              e.preventDefault();
              onSearchSubmit(searchQuery);
            }
          }}
          placeholder="Buscar publicações, professores, temas..."
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        <nav className="flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white p-1">
          {onSelectMenu
            ? NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = activeMenu === id;
                return (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={() => onSelectMenu(id)}
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      active
                        ? "bg-cyan-50 text-cyan-600"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
                    ].join(" ")}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                );
              })
            : null}
          <CommunityNotificationsIcon className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" />
          <CommunityMessagesIcon
            initialOpen={initialOpenMessages}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          />
        </nav>

        <button
          type="button"
          onClick={onCreatePost}
          className="hidden items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-200/50 transition hover:bg-cyan-600 xl:flex"
        >
          <IconPlus className="h-4 w-4" />
          Criar publicação
        </button>

        <button
          type="button"
          onClick={onCreatePost}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md xl:hidden"
          aria-label="Criar publicação"
        >
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
