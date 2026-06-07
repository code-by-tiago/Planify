"use client";

import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  downloadBibliotecaMaterial,
  type BibliotecaDownloadFormat,
} from "@/lib/biblioteca/biblioteca-download-client";
import { useEffect, useMemo, useState } from "react";

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

function formatBytes(value: number | undefined) {
  if (!value) return "";
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function openInEditor(item: BibliotecaItem) {
  const html = `
    <article class="planify-doc" style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>${item.title}</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Etapa</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.etapa || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Ano/Série</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.anoSerie || "Geral"}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Componente</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.componente || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tipo</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tipoMaterial || item.categoria || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tema</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tema || ""}</td></tr>
      </table>
      <h2>Descrição pedagógica</h2>
      <p>${item.description || ""}</p>
    </article>
  `;

  localStorage.setItem(
    "planify_editor_document",
    JSON.stringify({
      type: "biblioteca",
      title: item.title,
      html,
      content: html,
      updatedAt: new Date().toISOString(),
    }),
  );

  localStorage.setItem("planify_editor_content", html);
  window.location.href = "/editor?from=biblioteca";
}

function MaterialActions({
  item,
  downloadingKey,
  onDownload,
  compact,
}: {
  item: BibliotecaItem;
  downloadingKey: string | null;
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
            {downloadingKey === `${item.id}:docx` ? "DOCX…" : "Baixar DOCX"}
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
        onClick={() => openInEditor(item)}
        className={`${btnClass} w-full border border-cyan-400/25 bg-white/80 text-cyan-800 hover:bg-cyan-50`}
      >
        <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
        Abrir no editor
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
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

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
      setError(
        err instanceof Error ? err.message : "Erro ao carregar a Biblioteca.",
      );
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
          description="Recursos pedagógicos selecionados pela equipe — baixe DOCX/PDF ou abra no editor para personalizar."
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

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {error}
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/login?redirect=/biblioteca&premium=required" className="pl-hud-btn rounded-lg px-4 py-2 text-xs">
                Fazer login
              </a>
              <a href="/planos" className="pl-hud-btn-secondary rounded-lg px-4 py-2 text-xs">
                Ver planos
              </a>
            </div>
          </div>
        ) : null}

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
                <article
                  key={item.id}
                  className={`pl-hud-hub-app flex min-h-[17rem] flex-col rounded-2xl p-4 transition ${
                    isSelected
                      ? "border-cyan-400/50 shadow-sm"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="flex flex-1 flex-col text-left"
                  >
                    <span className="inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
                      {item.tipoMaterial || item.categoria}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                    <div className="mt-auto space-y-1 pt-3 text-[11px] font-medium text-slate-500">
                      <p>
                        {item.componente} · {item.etapa}
                        {item.anoSerie ? ` · ${item.anoSerie}` : ""}
                      </p>
                      {item.tema ? <p>{item.tema}</p> : null}
                      {item.fileSize ? <p>{formatBytes(item.fileSize)}</p> : null}
                    </div>
                  </button>
                  <div className="mt-3 border-t border-cyan-400/10 pt-3">
                    <MaterialActions
                      item={item}
                      downloadingKey={downloadingKey}
                      onDownload={handleDownload}
                      compact
                    />
                  </div>
                </article>
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
