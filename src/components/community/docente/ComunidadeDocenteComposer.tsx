"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { IconFolder, IconGraduation } from "@/components/community/docente/docente-icons";
import type { ComposerIntent } from "@/components/community/docente/ComunidadeDocenteCreatePostModal";

function IconImagePicture({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l5-5 4 4 3.5-3.5L21 16" />
    </svg>
  );
}

function IconPaperclip({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l6.5-6.5a3 3 0 1 1 4.24 4.24l-8.2 8.2a5 5 0 0 1-7.07-7.07l7.5-7.5" />
    </svg>
  );
}

type QuickAction = {
  key: ComposerIntent;
  label: string;
  icon: (className: string) => React.ReactNode;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: "aulas",
    label: "Aulas",
    icon: (className) => <IconGraduation className={className} />,
    color: "text-violet-500",
  },
  {
    key: "materiais",
    label: "Materiais",
    icon: (className) => <IconFolder className={className} />,
    color: "text-cyan-500",
  },
  {
    key: "imagem",
    label: "Imagem",
    icon: (className) => <IconImagePicture className={className} />,
    color: "text-emerald-500",
  },
  {
    key: "arquivo",
    label: "Arquivo",
    icon: (className) => <IconPaperclip className={className} />,
    color: "text-amber-500",
  },
];

type ComunidadeDocenteComposerProps = {
  viewerName: string;
  viewerAvatarUrl?: string | null;
  viewerUserId?: string | null;
  onOpenComposer: (intent?: ComposerIntent) => void;
};

export function ComunidadeDocenteComposer({
  viewerName,
  viewerAvatarUrl,
  viewerUserId,
  onOpenComposer,
}: ComunidadeDocenteComposerProps) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-3">
        <CommunityAuthorAvatar
          userId={viewerUserId}
          name={viewerName}
          avatarUrl={viewerAvatarUrl}
          linkable={false}
        />
        <button
          type="button"
          onClick={() => onOpenComposer("texto")}
          className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-400 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="flex-1">
            Compartilhe uma dúvida, ideia ou mensagem com outros professores...
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 shrink-0 text-slate-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => onOpenComposer(action.key)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-[#0F172A]"
          >
            <span className={action.color}>{action.icon("h-[18px] w-[18px]")}</span>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
