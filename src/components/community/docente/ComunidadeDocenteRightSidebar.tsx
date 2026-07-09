"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { communityProfileHref } from "@/components/community/CommunityAuthorLink";
import { useComunidadeEmbedded } from "@/hooks/useComunidadeEmbedded";
import Link from "next/link";
import type { DocenteAuthor } from "@/lib/community/docente-types";

type ViewerProfileSummary = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  topComponentes: string[];
  schoolName: string | null;
  roleLabel?: string | null;
  gradeLabel?: string | null;
};

type ComunidadeDocenteRightSidebarProps = {
  suggestedTeachers?: DocenteAuthor[];
  viewerProfile?: ViewerProfileSummary | null;
  onFollow: (authorId: string) => void;
  onOpenProfile?: () => void;
};

export function ComunidadeDocenteRightSidebar({
  suggestedTeachers = [],
  viewerProfile,
  onFollow,
  onOpenProfile,
}: ComunidadeDocenteRightSidebarProps) {
  const embedded = useComunidadeEmbedded();
  const specialty =
    viewerProfile?.topComponentes?.[0] ||
    viewerProfile?.roleLabel ||
    "Professor(a)";
  const grade = viewerProfile?.gradeLabel || viewerProfile?.schoolName || null;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[300px]">
      {viewerProfile ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative h-[88px] bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50">
            {viewerProfile.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewerProfile.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
            {onOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Editar perfil"
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="relative px-5 pb-5 pt-0">
            <div className="-mt-8 mb-3">
              <CommunityAuthorAvatar
                userId={viewerProfile.userId}
                name={viewerProfile.displayName}
                avatarUrl={viewerProfile.avatarUrl}
                linkable={false}
                size="md"
              />
            </div>
            <p className="truncate text-sm font-extrabold text-[#0F172A]">
              {viewerProfile.displayName}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
              {[specialty, grade].filter(Boolean).join(" · ")}
            </p>

            {viewerProfile.topComponentes.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {viewerProfile.topComponentes.slice(0, 3).map((comp) => (
                  <span
                    key={comp}
                    className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-700"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            ) : null}

            {onOpenProfile ? (
              <button
                type="button"
                onClick={onOpenProfile}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="3.5" />
                </svg>
                Meu perfil
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">Professores como você</h2>
        {suggestedTeachers.length === 0 ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Em breve sugeriremos professores com perfil parecido com o seu.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {suggestedTeachers.map((author) => (
              <li key={author.id} className="flex items-start gap-3">
                <CommunityAuthorAvatar
                  userId={author.id}
                  name={author.name}
                  avatarUrl={author.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={communityProfileHref(author.id, embedded)}
                    className="block truncate text-xs font-bold text-[#0F172A] hover:text-cyan-700"
                  >
                    {author.name}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-400">
                    {author.specialty}
                  </p>
                  <button
                    type="button"
                    onClick={() => onFollow(author.id)}
                    className={[
                      "mt-2 rounded-lg px-3 py-1 text-[11px] font-bold transition",
                      author.isFollowing
                        ? "border border-slate-200 bg-white text-slate-500"
                        : "bg-[#0F172A] text-white hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {author.isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
