"use client";

import {
  formatDocenteNumber,
} from "@/lib/community/docente-mock-data";
import type { DocenteStats } from "@/lib/community/docente-types";
import {
  IconChat,
  IconFolder,
  IconGraduation,
  IconUsers,
} from "@/components/community/docente/docente-icons";

const STATS = [
  {
    key: "activeTeachers" as const,
    label: "Professores ativos",
    icon: IconGraduation,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    key: "sharedMaterials" as const,
    label: "Materiais compartilhados",
    icon: IconFolder,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "openDiscussions" as const,
    label: "Discussões abertas",
    icon: IconChat,
    color: "bg-violet-50 text-violet-600",
  },
  {
    key: "studyGroups" as const,
    label: "Grupos de estudo",
    icon: IconUsers,
    color: "bg-amber-50 text-amber-600",
  },
];

export function ComunidadeDocenteStats({ stats }: { stats: DocenteStats }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {STATS.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              {label}
            </p>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl">
            {formatDocenteNumber(stats[key])}
          </p>
        </div>
      ))}
    </section>
  );
}
