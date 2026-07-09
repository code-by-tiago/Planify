"use client";

import { ComunidadeDocenteMaterialCard } from "@/components/community/docente/ComunidadeDocenteMaterialCard";
import { formatDocenteNumber } from "@/lib/community/docente-utils";
import type { DocenteBadgeProgress, DocenteDiscussion, DocenteMaterial } from "@/lib/community/docente-types";

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

function BadgeProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ComunidadeDocenteDesafios({
  badgeProgress,
  onParticipateChallenge,
}: {
  badgeProgress: DocenteBadgeProgress[];
  onParticipateChallenge?: (slug: string) => void;
}) {
  if (!badgeProgress.length) {
    return (
      <EmptyState
        title="Desafios e badges"
        message="Participe da comunidade para desbloquear selos e acompanhar seu progresso."
      />
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Desafios e badges</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {badgeProgress.map((badge) => (
          <article
            key={badge.id}
            className={[
              "rounded-2xl border bg-white p-5 shadow-sm",
              badge.earned ? "border-emerald-200" : "border-slate-200",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="inline-flex rounded-xl px-3 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: badge.color }}
              >
                {badge.name}
              </div>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  badge.earned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {badge.earned ? "Conquistado" : "Em progresso"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{badge.description}</p>
            <div className="mt-4 space-y-3">
              {badge.progress.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{item.label}</span>
                    <span>
                      {formatDocenteNumber(item.current)} / {formatDocenteNumber(item.target)}
                    </span>
                  </div>
                  <BadgeProgressBar current={item.current} target={item.target} />
                </div>
              ))}
            </div>
            {!badge.earned && badge.slug === "desafio-bncc" && onParticipateChallenge ? (
              <button
                type="button"
                onClick={() => onParticipateChallenge(badge.slug)}
                className="mt-4 w-full rounded-xl bg-[#0F172A] py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Participar do desafio BNCC
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComunidadeDocenteSalvos({
  materials,
  discussions = [],
  embedded = false,
  onLike,
  onSave,
  onSaveDiscussion,
  onOpenDiscussion,
  onOpenMaterial,
  onDownload,
  downloadingMaterialId,
  onBrowseMaterials,
}: {
  materials: DocenteMaterial[];
  discussions?: DocenteDiscussion[];
  embedded?: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onSaveDiscussion?: (id: string) => void;
  onOpenDiscussion?: (id: string) => void;
  onOpenMaterial?: (id: string) => void;
  onDownload?: (id: string) => void;
  downloadingMaterialId?: string | null;
  onBrowseMaterials?: () => void;
}) {
  const savedMaterials = materials.filter((m) => m.savedByMe);
  const savedPosts = discussions.filter((d) => d.savedByMe);

  if (!savedMaterials.length && !savedPosts.length) {
    return (
      <EmptyState
        title="Salvos"
        message="Você ainda não salvou discussões nem materiais. Explore a comunidade e salve o que for útil."
        actionLabel="Ver materiais"
        onAction={onBrowseMaterials}
      />
    );
  }

  return (
    <section className="space-y-6">
      {savedPosts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Discussões salvas</h2>
          <ul className="space-y-2">
            {savedPosts.map((discussion) => (
              <li key={discussion.id}>
                <button
                  type="button"
                  onClick={() => onOpenDiscussion?.(discussion.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-cyan-200"
                >
                  <span className="font-semibold text-[#0F172A]">{discussion.title}</span>
                  <span className="text-xs text-slate-400">{discussion.author.name}</span>
                </button>
                {onSaveDiscussion ? (
                  <button
                    type="button"
                    onClick={() => onSaveDiscussion(discussion.id)}
                    className="mt-1 text-xs font-bold text-cyan-600"
                  >
                    Remover
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {savedMaterials.length > 0 ? (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Materiais salvos</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {savedMaterials.map((material) => (
          <ComunidadeDocenteMaterialCard
            key={material.id}
            material={material}
            embedded={embedded}
            onOpen={onOpenMaterial}
            onLike={onLike}
            onSave={onSave}
            onDownload={onDownload}
            downloading={downloadingMaterialId === material.id}
          />
        ))}
      </div>
    </div>
      ) : null}
    </section>
  );
}
