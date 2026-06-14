"use client";

import { useCallback, useEffect, useState } from "react";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { ComunidadeDocenteDesafios } from "@/components/community/docente/ComunidadeDocenteSections";
import type { DocenteBadgeProgress } from "@/lib/community/docente-types";
import { comunidadeRoutes } from "@/lib/community/docente-utils";

export function ComunidadeDocenteDesafiosPageClient() {
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/community/docente", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (data.ok) {
        setBadgeProgress(data.badgeProgress || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleParticipate = async (challengeSlug: string) => {
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "participate_challenge", challengeSlug }),
    });
    if (response.ok) await load();
  };

  return (
    <ComunidadeDocenteDetailShell
      activeMenu="desafios"
      breadcrumbs={[]}
      title="Desafios e badges"
      subtitle="Acompanhe seu progresso e conquiste selos na comunidade."
    >
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      ) : (
        <ComunidadeDocenteDesafios
          badgeProgress={badgeProgress}
          onParticipateChallenge={handleParticipate}
        />
      )}
    </ComunidadeDocenteDetailShell>
  );
}
