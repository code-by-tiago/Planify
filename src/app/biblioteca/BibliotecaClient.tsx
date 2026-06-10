"use client";

import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  downloadBibliotecaMaterial,
  type BibliotecaDownloadFormat,
} from "@/lib/biblioteca/biblioteca-download-client";
import { openBibliotecaMaterialInEditor } from "@/lib/biblioteca/biblioteca-editor-open";
import { PlanifyMaterialHubCard } from "@/components/materials/PlanifyMaterialHubCard";
import { formatMaterialBytes } from "@/lib/materials/format-material-bytes";
import { useEffect, useMemo, useState } from "react";
import {
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
} from "@/lib/pro/generation-error-ui";

type BibliotecaItem = {
  id: string;
  title: string;
  description: string;
  etapa: string;
  areaConhecimento?: string;
  anoSerie?: string;
  categoria: string;
  tipoMaterial?: string;
  componente: string;
  tema?: string;
  finalidade: string;
  nivelDificuldade?: string;
  duracao?: string;
  habilidadesBncc?: string[];
  observacoes?: string;
  tags: string[];
  fileName?: string;
  fileMime?: string;
  fileSize?: number;
  signedUrl?: string | null;
  createdAt?: string | null;
};

const etapaOptions = ["Todas", "Educação Infantil", "Ensino Fundamental", "Ensino Médio"];

const tipoOptions = [
  "Todos",
  "Atividade",
  "Avaliação",
  "Apostila",
  "Sequência didática",
  "Jogo pedagógico",
  "Planejamento",
  "Slides",
  "Projeto",
  "Material de apoio",
  "Outro",
];

const hudInput =
  "h-11 w-full rounded-xl border border-cyan-400/20 bg-white/90 px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function MaterialActions({
  item,
  downloadingKey,
  openingEditorId,
  onOpenEditor,
  onDownload,
  compact,
}: {
  item: BibliotecaItem;
  downloadingKey: string | null;
  openingEditorId: string | null;
  onOpenEditor: (item: BibliotecaItem) => void;
  onDownload: (item: BibliotecaItem, format: BibliotecaDownloadFormat) => void;
  compact?: boolean;
}) {
  const btnClass = compact
    ? "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-bold"
    : "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold";

  const hasFile = Boolean(item.fileName || item.signedUrl);

  return (
    <div
      className="flex flex-col gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {hasFile ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={Boolean(downloadingKey)}
            onClick={() => onDownload(item, "docx")}
            className={`${btnClass} pl-hud-btn disabled:opacity-60`}
          >
            <PlanifyIcon name="download" className="h-3.5 w-3.5" />
            {downloadingKey === `${item.id}:docx` ? "Baixando…" : "Baixar arquivo"}
          </button>
          <button
            type="button"
            disabled={Boolean(downloadingKey)}
            onClick={() => onDownload(item, "pdf")}
            className={`${btnClass} pl-hud-btn-secondary disabled:opacity-60`}
          >
            <PlanifyIcon name="download" className="h-3.5 w-3.5" />
            {downloadingKey === `${item.id}:pdf` ? "PDF…" : "Baixar PDF"}
          </button>
        </div>
      ) : (
        <span className="text-[11px] font-semibold text-amber-700">
          Anexo indisponível
        </span>
      )}
      <button
        type="button"
        disabled={openingEditorId === item.id}
        onClick={() => onOpenEditor(item)}
        className={`${btnClass} w-full border border-cyan-400/25 bg-white/80 text-cyan-800 hover:bg-cyan-50 disabled:opacity-60`}
      >
        <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
        {openingEditorId === item.id ? "Abrindo…" : "Abrir no editor"}
      </button>
    </div>
  );
}

export function BibliotecaClient() {
  const [query, setQuery] = useState("");
  const [etapa, setEtapa] = useState("Todas");
  const [tipo, setTipo] = useState("Todos");
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [selected, setSelected] = useState<BibliotecaItem | null>(null);
  const [status, setStatus] = useState("Carregando Biblioteca...");
  const [error, setError] = useState("");
  const [errorRetryable, setErrorRetryable] = useState(false);
  const { runWithRetry } = useRetryableAction();
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [openingEditorId, setOpeningEditorId] = useState<string | null>(null);

  async function handleOpenInEditor(item: BibliotecaItem) {
    setOpeningEditorId(item.id);
    setError("");
    try {
      await openBibliotecaMaterialInEditor(item);
    } catch (err) {
      const formatted = formatGenerationError(err);
      setError(formatted.message);
      setErrorRetryable(formatted.retryable);
      setStatus("Não foi possível abrir no editor.");
    } finally {
      setOpeningEditorId(null);
    }
  }

  async function loadPremiumMaterials() {
    setLoading(true);
    setError("");
    setStatus("Carregando materiais curados...");

    try {
      const response = await fetch("/api/biblioteca/materiais", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        setItems([]);
        setSelected(null);
        setError(data?.error?.message || "A Biblioteca exige login com plano ativo.");
        setStatus("Acesso premium necessário.");
        return;
      }

      const remoteItems = Array.isArray(data.items) ? data.items : [];
      setItems(remoteItems);
      setSelected(remoteItems[0] || null);
      setStatus(
        remoteItems.length > 0
          ? `${remoteItems.length} material(is) curado(s) pelo Planify.`
          : "Nenhum material cadastrado ainda.",
      );
    } catch (err) {
      setItems([]);
      setSelected(null);
      const formatted = formatGenerationError(err);
      setError(formatted.message);
      setErrorRetryable(formatted.retryable);
      setStatus("Biblioteca indisponível no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPremiumMaterials();
  }, []);

  const filteredItems = useMemo(() => {
    const search = normalize(query);
    return items.filter((item) => {
      const matchSearch =
        !search ||
        normalize(
          `${item.title} ${item.description} ${item.etapa} ${item.anoSerie || ""} ${item.componente} ${item.tipoMaterial || ""} ${item.categoria} ${item.tema || ""} ${item.tags.join(" ")}`,
        ).includes(search);
      const matchEtapa = etapa === "Todas" || item.etapa === etapa;
      const itemType = item.tipoMaterial || item.categoria;
      const matchTipo =
        tipo === "Todos" || itemType === tipo || item.categoria === tipo;
      return matchSearch && matchEtapa && matchTipo;
    });
  }, [items, query, etapa, tipo]);

  async function handleDownload(
    item: BibliotecaItem,
    format: BibliotecaDownloadFormat,
  ) {
    const downloadKey = `${item.id}:${format}`;
    setDownloadingKey(downloadKey);
    setError("");

    try {
      await downloadBibliotecaMaterial({
        id: item.id,
        format,
        fallbackFileName: item.fileName || `${item.title}.${format}`,
      });
      setStatus(`Download ${format.toUpperCase()} iniciado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar material.");
      setStatus("Falha no download.");
    } finally {
      setDownloadingKey(null);
    }
  }

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Biblioteca"
          icon="library"
          title="Materiais curados pelo Planify"
          description="Recursos pedagógicos selecionados pela equipe — baixe arquivos/PDF ou abra no editor para personalizar."
        />
      }
    >
      <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        <section className="pl-hud-glass rounded-2xl p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Buscar</span>
              <div className="relative">
                <PlanifyIcon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tema, componente, série..."
                  className={`${hudInput} pl-9`}
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Etapa</span>
              <select
                value={etapa}
                onChange={(event) => setEtapa(event.target.value)}
                className={hudInput}
              >
                {etapaOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Tipo</span>
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className={hudInput}
              >
                {tipoOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={loadPremiumMaterials}
              className="pl-hud-btn h-11 rounded-xl px-4 text-xs font-semibold"
            >
              Atualizar
            </button>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">{status}</p>
        </section>

        <GenerationErrorBanner
          message={error}
          retryable={errorRetryable}
          onRetry={() => void loadPremiumMaterials()}
          retrying={loading}
          className="mb-4"
        />

        {loading && items.length === 0 ? (
          <div className="pl-hud-glass flex items-center justify-center rounded-2xl p-12">
            <span className="text-sm font-semibold text-cyan-700">
              Carregando Biblioteca...
            </span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <PlanifyMaterialHubCard
                  key={item.id}
                  badge={item.tipoMaterial || item.categoria}
                  title={item.title}
                  description={item.description}
                  metaPrimary={`${item.componente} · ${item.etapa}${item.anoSerie ? ` · ${item.anoSerie}` : ""}`}
                  metaSecondary={item.tema || undefined}
                  metaTertiary={formatMaterialBytes(item.fileSize) || undefined}
                  selected={isSelected}
                  onSelect={() => setSelected(item)}
                  footer={
                    <MaterialActions
                      item={item}
                      downloadingKey={downloadingKey}
                      openingEditorId={openingEditorId}
                      onOpenEditor={(entry) => void handleOpenInEditor(entry)}
                      onDownload={handleDownload}
                      compact
                    />
                  }
                />
              );
            })}
          </div>
        ) : (
          <section className="pl-hud-glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
            <PlanifyOwlMark size={80} glow />
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-cyan-600">
              Biblioteca vazia
            </p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">
              Nenhum material curado ainda
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Assim que a equipe Planify publicar materiais, eles aparecerão aqui
              para download e edição.
            </p>
          </section>
        )}

        {selected ? (
          <section className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
              Detalhes
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
              {selected.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {selected.description}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                ["Etapa", selected.etapa],
                ["Ano/Série", selected.anoSerie || "Geral"],
                ["Componente", selected.componente],
                ["Tipo", selected.tipoMaterial || selected.categoria],
                ["Tema", selected.tema || "—"],
                ["Finalidade", selected.finalidade || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-cyan-400/15 bg-white/70 px-3 py-2.5"
                >
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 max-w-xl">
              <MaterialActions
                item={selected}
                downloadingKey={downloadingKey}
                openingEditorId={openingEditorId}
                onOpenEditor={(entry) => void handleOpenInEditor(entry)}
                onDownload={handleDownload}
              />
            </div>
          </section>
        ) : null}
      </div>
    </PlanifyWorkspacePane>
  );
}

export default BibliotecaClient;
