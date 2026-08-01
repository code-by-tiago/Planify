"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { CommunityNotificationsIcon } from "@/components/community/CommunityNotificationsIcon";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import {
  IconChevronDown,
  IconMenu,
  IconPlus,
  IconSearch,
} from "@/components/community/docente/docente-icons";

type ViewerProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type ComunidadeDocenteTopBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  onCreatePost: () => void;
  onOpenMenu: () => void;
  onOpenProfile?: () => void;
  initialOpenMessages?: boolean;
};

export function ComunidadeDocenteTopBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onCreatePost,
  onOpenMenu,
  onOpenProfile,
  initialOpenMessages = false,
}: ComunidadeDocenteTopBarProps) {
  const embedded = useComunidadeEmbedded();
  const [profile, setProfile] = useState<ViewerProfile | null>(null);

  useEffect(() => {
    void fetch("/api/community/profile", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.profile) {
          const nextProfile = {
            userId: String(data.profile.userId || ""),
            displayName: String(data.profile.fullName || data.profile.email || "Professor(a)"),
            avatarUrl: data.profile.avatarUrl || null,
          };
          setProfile(nextProfile);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        aria-label="Abrir menu"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 max-w-2xl flex-1">
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

        <CommunityNotificationsIcon />
        <CommunityMessagesIcon initialOpen={initialOpenMessages} />

        {onOpenProfile ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 sm:inline-flex"
          >
            Meu perfil
          </button>
        ) : null}

        {profile?.userId ? (
          onOpenProfile ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  <PlanifyOwlMark size={28} />
                </span>
              )}
              <span className="hidden text-sm font-semibold text-[#0F172A] lg:inline">
                {profile.displayName}
              </span>
              <IconChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </button>
          ) : (
            <Link
              href={communityProfileHref(profile.userId, embedded)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300"
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  <PlanifyOwlMark size={28} />
                </span>
              )}
              <span className="hidden text-sm font-semibold text-[#0F172A] lg:inline">
                {profile.displayName}
              </span>
              <IconChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </Link>
          )
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <PlanifyOwlMark size={28} />
            </span>
            <span className="hidden text-sm font-semibold text-slate-400 lg:inline">
              Carregando…
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
