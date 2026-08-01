"use client";

import { useCallback, useEffect, useState } from "react";
import { ComunidadeDocenteBnccChallengeModal } from "@/components/community/docente/ComunidadeDocenteBnccChallengeModal";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { ComunidadeDocenteDesafios } from "@/components/community/docente/ComunidadeDocenteSections";
import type { DocenteBadgeProgress } from "@/lib/community/docente-types";
import { homeWithAba } from "@/lib/community/docente-utils";

export function ComunidadeDocenteDesafiosPageClient({
  forceEmbedded,
}: {
  forceEmbedded?: boolean;
} = {}) {
  const embedded = Boolean(forceEmbedded);
  const [badgeProgress, setBadgeProgress] = useState<DocenteBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bnccOpen, setBnccOpen] = useState(false);
  const [status, setStatus] = useState("");

  const showToast = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3200);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/community/docente", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar os desafios.");
      }
      setBadgeProgress(data.badgeProgress || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar desafios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleParticipate = async (challengeSlug: string) => {
    if (challengeSlug === "desafio-bncc") {
      setBnccOpen(true);
      return;
    }
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "participate_challenge", challengeSlug }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast("Desafio registrado!");
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível registrar o desafio.");
    }
  };

  const completeBncc = async (reflection: string) => {
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "participate_challenge",
        challengeSlug: "desafio-bncc",
        reflection,
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      showToast("Desafio BNCC concluído com sucesso!");
      await load();
    } else {
      showToast(data?.error?.message || "Não foi possível concluir o desafio.");
      throw new Error("bncc failed");
    }
  };

  return (
    <ComunidadeDocenteDetailShell
      embedded={embedded}
      activeMenu="desafios"
      breadcrumbs={[{ label: "Desafios", href: homeWithAba("desafios", embedded) }]}
      title="Desafios e badges"
      subtitle="Acompanhe seu progresso e conquiste selos na comunidade."
    >
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 min-h-11 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <ComunidadeDocenteDesafios
          badgeProgress={badgeProgress}
          onParticipateChallenge={handleParticipate}
        />
      )}

      <ComunidadeDocenteBnccChallengeModal
        open={bnccOpen}
        onClose={() => setBnccOpen(false)}
        onComplete={completeBncc}
      />

      {status ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white shadow-xl"
        >
          {status}
        </div>
      ) : null}
    </ComunidadeDocenteDetailShell>
  );
}
