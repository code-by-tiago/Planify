"use client";

import { publishHtmlToMarketplace } from "@/lib/marketplace/marketplace-publish";
import Link from "next/link";
import { useState } from "react";

export type MarketplacePublishButtonProps = {
  title: string;
  getHtml: () => string;
  tipoMaterial?: string;
  tema?: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
  disabled?: boolean;
  className?: string;
  /** Texto do botão (padrão: frase completa) */
  label?: string;
  /** Modal de sucesso inline mais discreto */
  compact?: boolean;
};

export function MarketplacePublishButton({
  title,
  getHtml,
  tipoMaterial = "Material de apoio",
  tema,
  componente,
  etapa,
  anoSerie,
  disabled,
  className = "",
  label = "Compartilhar no Marketplace",
  compact = false,
}: MarketplacePublishButtonProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("planify, bncc");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  async function handlePublish() {
    setBusy(true);
    setError("");

    try {
      const result = await publishHtmlToMarketplace({
        title: title.trim() || "Material Planify",
        description,
        html: getHtml(),
        tipoMaterial,
        tema: tema || title,
        componente,
        etapa,
        anoSerie,
        tags: tags.split(/[,;]/).map((item) => item.trim()).filter(Boolean),
      });

      setSuccessId(result.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setSuccessId(null);
          setError("");
          setOpen(true);
        }}
        className={
          className ||
          "rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-5 py-3 text-sm font-black text-fuchsia-800 transition hover:bg-fuchsia-100 disabled:opacity-50"
        }
      >
        {label}
      </button>

      {successId && !compact ? (
        <p className="mt-2 text-xs font-semibold text-emerald-700">
          Publicado!{" "}
          <Link href="/dashboard?secao=marketplace" className="underline">
            Ver na comunidade
          </Link>
        </p>
      ) : null}

      {successId && compact ? (
        <span className="text-[11px] font-bold text-emerald-700">
          ✓ Publicado{" "}
          <Link href="/dashboard?secao=marketplace" className="underline">
            ver
          </Link>
        </span>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-labelledby="marketplace-publish-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h3
              id="marketplace-publish-title"
              className="text-xl font-black text-slate-950"
            >
              Publicar para outras professoras
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              O material ficará visível no Marketplace. Outros professores poderão baixar e
              comentar.
            </p>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-slate-700">Título</span>
              <input
                readOnly
                value={title}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800"
              />
            </label>

            <label className="mt-3 grid gap-2">
              <span className="text-sm font-bold text-slate-700">Descrição *</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Como usar em aula, série indicada, tempo estimado..."
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="mt-3 grid gap-2">
              <span className="text-sm font-bold text-slate-700">Tags</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !description.trim()}
                onClick={() => void handlePublish()}
                className="rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-black text-white hover:bg-fuchsia-700 disabled:opacity-50"
              >
                {busy ? "Publicando..." : "Publicar agora"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
