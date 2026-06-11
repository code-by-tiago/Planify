"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlanifyModal } from "@/components/ui/PlanifyModal";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { QuestionBankItem } from "@/types/question-bank";

type CreationStep = "mode" | "picker" | null;

type ExamTeachyCreationFlowProps = {
  open: boolean;
  toolLabel: string;
  tema: string;
  componente: string;
  anoSerie: string;
  quantidade: number;
  onClose: () => void;
  onChooseAutomatic: (mode: "hibrido" | "ia") => void;
  onAssembleFromBank: (questionIds: string[]) => void;
};

async function fetchBankItems(params: {
  componente: string;
  anoSerie: string;
  q: string;
}): Promise<QuestionBankItem[]> {
  const search = new URLSearchParams({
    limit: "120",
    componente: params.componente,
    anoSerie: params.anoSerie,
    q: params.q,
  });

  const [communityRes, mineRes] = await Promise.all([
    planifyAuthenticatedFetch(`/api/banco-questoes?source=community&${search}`),
    planifyAuthenticatedFetch(`/api/banco-questoes?source=mine&${search}`),
  ]);

  const community = await communityRes.json().catch(() => null);
  const mine = await mineRes.json().catch(() => null);

  const items: QuestionBankItem[] = [];
  if (community?.ok && Array.isArray(community.items)) {
    items.push(...community.items);
  }
  if (mine?.ok && Array.isArray(mine.items)) {
    items.push(...mine.items);
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.contentHash || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ExamTeachyCreationFlow({
  open,
  toolLabel,
  tema,
  componente,
  anoSerie,
  quantidade,
  onClose,
  onChooseAutomatic,
  onAssembleFromBank,
}: ExamTeachyCreationFlowProps) {
  const [step, setStep] = useState<CreationStep>("mode");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reset = useCallback(() => {
    setStep("mode");
    setLoading(false);
    setItems([]);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const loadBank = useCallback(async () => {
    setLoading(true);
    try {
      const bankItems = await fetchBankItems({
        componente,
        anoSerie,
        q: tema,
      });
      setItems(bankItems);
      setSelected(new Set(bankItems.slice(0, quantidade).map((item) => item.id)));
    } finally {
      setLoading(false);
    }
  }, [anoSerie, componente, quantidade, tema]);

  const selectedCount = selected.size;
  const canAssemble = selectedCount > 0;

  const previewItems = useMemo(
    () => items.slice(0, 80),
    [items],
  );

  function toggleItem(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  if (step === "mode") {
    return (
      <PlanifyModal
        open
        onClose={onClose}
        title="Como você quer criar?"
        description={`Estilo Teachy — escolha o caminho para sua ${toolLabel.toLowerCase()}.`}
        maxWidth="max-w-3xl"
      >
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChooseAutomatic("hibrido")}
            className="rounded-2xl border-2 border-cyan-500/30 bg-cyan-50/80 p-5 text-left transition hover:border-cyan-500 hover:bg-cyan-50"
          >
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">
              Lista automática
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Montamos do banco Planify e a IA só completa o que faltar. Mais
              rápido e consistente — padrão Teachy.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("picker");
              void loadBank();
            }}
            className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-slate-400 hover:bg-slate-50"
          >
            <p className="text-sm font-black uppercase tracking-wide text-slate-800">
              Banco de questões
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Escolha questões revisadas com gabarito do acervo. Entrega
              instantânea, sem IA.
            </p>
          </button>
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => onChooseAutomatic("ia")}
            className="text-xs font-bold text-slate-500 underline-offset-2 hover:underline"
          >
            Prefiro IA completa (máxima originalidade)
          </button>
        </div>
      </PlanifyModal>
    );
  }

  return (
    <PlanifyModal
      open
      onClose={onClose}
      title="Banco de questões"
      description={`Selecione as questões para ${toolLabel.toLowerCase()} · meta: ${quantidade}`}
      maxWidth="max-w-4xl"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-slate-100 px-6 py-3 text-xs font-semibold text-slate-500">
          {loading
            ? "Carregando acervo…"
            : `${previewItems.length} questões encontradas · ${selectedCount} selecionada(s)`}
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {!loading && previewItems.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Nenhuma questão para este filtro. Use lista automática ou ajuste tema/disciplina.
            </p>
          ) : null}

          <ul className="space-y-3">
            {previewItems.map((item) => {
              const checked = selected.has(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={[
                      "flex cursor-pointer gap-3 rounded-xl border p-4 transition",
                      checked
                        ? "border-cyan-500/40 bg-cyan-50/60"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      className="mt-1 h-4 w-4 accent-cyan-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {item.componente} · {item.anoSerie}
                        {item.isCommunity ? " · Comunidade" : ""}
                      </span>
                      <span className="mt-1 block text-sm font-semibold leading-6 text-slate-800">
                        {item.enunciado}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => setStep("mode")}
            className="text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={!canAssemble}
            onClick={() => onAssembleFromBank([...selected])}
            className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Montar {toolLabel.toLowerCase()}
          </button>
        </div>
      </div>
    </PlanifyModal>
  );
}
