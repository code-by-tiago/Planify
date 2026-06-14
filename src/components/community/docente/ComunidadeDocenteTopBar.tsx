"use client";

import { useEffect, useState } from "react";
import { CommunityNotificationsIcon } from "@/components/community/CommunityNotificationsIcon";
import {
  IconBell,
  IconChevronDown,
  IconMenu,
  IconMessage,
  IconPlus,
  IconSearch,
} from "@/components/community/docente/docente-icons";
import { DOCENTE_CURRENT_USER } from "@/lib/community/docente-mock-data";

type ProfileSummary = {
  displayName: string;
  avatarUrl: string | null;
};

type ComunidadeDocenteTopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreatePost: () => void;
  onOpenMenu: () => void;
  notificationCount?: number;
};

export function ComunidadeDocenteTopBar({
  searchQuery,
  onSearchChange,
  onCreatePost,
  onOpenMenu,
  notificationCount = 3,
}: ComunidadeDocenteTopBarProps) {
  const [profile, setProfile] = useState<ProfileSummary>({
    displayName: DOCENTE_CURRENT_USER.name,
    avatarUrl: DOCENTE_CURRENT_USER.avatarUrl,
  });

  useEffect(() => {
    void fetch("/api/community/profile", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.profile) {
          setProfile({
            displayName: data.profile.displayName || DOCENTE_CURRENT_USER.name,
            avatarUrl: data.profile.avatarUrl || null,
          });
        }
      })
      .catch(() => {});
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        aria-label="Abrir menu"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 max-w-2xl">
        <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar materiais, professores, temas..."
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onCreatePost}
          className="hidden items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-200/50 transition hover:bg-cyan-600 sm:flex"
        >
          <IconPlus className="h-4 w-4" />
          Criar publicação
        </button>

        <button
          type="button"
          onClick={onCreatePost}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md sm:hidden"
          aria-label="Criar publicação"
        >
          <IconPlus className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <CommunityNotificationsIcon />
        </div>

        <button
          type="button"
          className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 sm:flex"
          aria-label="Notificações"
        >
          <IconBell className="h-5 w-5" />
          {notificationCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 md:flex"
          aria-label="Mensagens"
        >
          <IconMessage className="h-5 w-5" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl ?? DOCENTE_CURRENT_USER.avatarUrl ?? ""}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="hidden text-sm font-semibold text-[#0F172A] lg:inline">
            {profile.displayName}
          </span>
          <IconChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
        </button>
      </div>
    </header>
  );
}
