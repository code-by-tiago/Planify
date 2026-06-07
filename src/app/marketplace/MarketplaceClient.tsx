"use client";

import { MarketplaceComments } from "@/components/marketplace/MarketplaceComments";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  downloadMarketplaceMaterial,
  type MarketplaceDownloadFormat,
} from "@/lib/marketplace/marketplace-download-client";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type MarketplaceItem = {
  id: string;
  userId: string;
  ownerEmail: string;
  authorName: string;
  title: string;
  description: string;
  etapa: string;
  anoSerie: string;
  componente: string;
  tipoMaterial: string;
  tema: string;
  tags: string[];
  fileName: string;
  fileMime: string;
  fileSize: number;
  isPublished: boolean;
  downloadsCount: number;
  signedUrl: string | null;
  createdAt: string | null;
};

type FormState = {
  title: string;
  description: string;
  etapa: string;
  anoSerie: string;
  componente: string;
  tipoMaterial: string;
  tema: string;
  tags: string;
  authorName: string;
  isPublished: boolean;
};

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];

const anoSerieOptions: Record<string, string[]> = {
  "Educação Infantil": ["Geral", "Berçário", "Maternal", "Pré I", "Pré II"],
  "Ensino Fundamental": [
    "Geral",
    "1º ano",
    "2º ano",
    "3º ano",
    "4º ano",
    "5º ano",
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
  ],
  "Ensino Médio": ["Geral", "1ª série", "2ª série", "3ª série"],
};

const componenteOptions = [
  "Multicomponente",
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Arte",
  "Educação Física",
  "Língua Inglesa",
  "Biologia",
  "Física",
  "Química",
  "Filosofia",
  "Sociologia",
  "Ensino Religioso",
];

const tipoMaterialOptions = [
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

function createInitialForm(): FormState {
  return {
    title: "",
    description: "",
    etapa: "Ensino Fundamental",
    anoSerie: "Geral",
    componente: "Multicomponente",
    tipoMaterial: "Material de apoio",
    tema: "",
    tags: "",
    authorName: "",
    isPublished: true,
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function formatBytes(value: number) {
  if (!value) return "0 KB";
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function MaterialDownloadButtons({
  item,
  downloadingKey,
  onDownload,
  compact,
}: {
  item: MarketplaceItem;
  downloadingKey: string | null;
  onDownload: (item: MarketplaceItem, format: MarketplaceDownloadFormat) => void;
  compact?: boolean;
}) {
  if (!item.fileName && !item.signedUrl) {
    return (
      <span className="text-[11px] font-semibold text-amber-700">
        Anexo indisponível
      </span>
    );
  }

  const btnClass = compact
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold"
    : "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold";

  return (
    <div
      className="flex gap-2"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
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
  );
}

export function MarketplaceClient() {
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selected, setSelected] = useState<MarketplaceItem | null>(null);
  const [query, setQuery] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("Todas");
  const [mineOnly, setMineOnly] = useState(false);
  const [status, setStatus] = useState("Carregando Comunidade...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const availableYears = anoSerieOptions[form.etapa] || ["Geral"];

  async function loadItems(nextMineOnly = mineOnly) {
    setLoading(true);
    setError("");
    setStatus("Carregando materiais compartilhados...");

    try {
      const response = await fetch(
        `/api/marketplace/materiais${nextMineOnly ? "?mine=true" : ""}`,
        { cache: "no-store", credentials: "include" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar a Comunidade.");
      }

      const remoteItems = Array.isArray(data.items) ? data.items : [];
      setItems(remoteItems);
      setSelected(remoteItems[0] || null);
      setStatus(
        nextMineOnly
          ? `${remoteItems.length} material(is) publicado(s) por você.`
          : `${remoteItems.length} material(is) na Comunidade.`,
      );
    } catch (err) {
      setItems([]);
      setSelected(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar Comunidade.");
      setStatus("Comunidade indisponível no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const search = normalize(query);
    return items.filter((item) => {
      const matchSearch =
        !search ||
        normalize(
          `${item.title} ${item.description} ${item.etapa} ${item.anoSerie} ${item.componente} ${item.tipoMaterial} ${item.tema} ${item.authorName} ${item.tags.join(" ")}`,
        ).includes(search);
      const matchEtapa = etapaFilter === "Todas" || item.etapa === etapaFilter;
      return matchSearch && matchEtapa;
    });
  }, [items, query, etapaFilter]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "etapa") {
        const years = anoSerieOptions[String(value)] || ["Geral"];
        next.anoSerie = years[0];
      }
      return next;
    });
  }

  function resetForm() {
    setForm(createInitialForm());
    setFile(null);
    setError("");
    setStatus("Formulário limpo.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Anexe um arquivo para compartilhar na Comunidade.");
      return;
    }

    setLoading(true);
    setStatus("Publicando material na Comunidade...");

    try {
      const body = new FormData();
      body.set("title", form.title);
      body.set("description", form.description);
      body.set("etapa", form.etapa);
      body.set("anoSerie", form.anoSerie);
      body.set("componente", form.componente);
      body.set("tipoMaterial", form.tipoMaterial);
      body.set("tema", form.tema || form.title);
      body.set("tags", form.tags);
      body.set("authorName", form.authorName || "Professor");
      body.set("isPublished", String(form.isPublished));
      body.set("file", file);

      const response = await fetch("/api/marketplace/materiais", {
        method: "POST",
        body,
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível publicar material.");
      }

      const newItem = data.item as MarketplaceItem;
      setForm(createInitialForm());
      setFile(null);
      setItems((current) => [newItem, ...current]);
      setSelected(newItem);
      setPublishOpen(false);
      setStatus("Material publicado na Comunidade com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar material.");
      setStatus("Falha ao publicar.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item: MarketplaceItem) {
    const confirmed = window.confirm(`Remover "${item.title}" da Comunidade?`);
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setStatus("Removendo material...");

    try {
      const response = await fetch(`/api/marketplace/materiais?id=${item.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível remover material.");
      }

      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      setSelected((current) => (current?.id === item.id ? null : current));
      setStatus("Material removido com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover material.");
      setStatus("Falha ao remover.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(
    item: MarketplaceItem,
    format: MarketplaceDownloadFormat,
  ) {
    const downloadKey = `${item.id}:${format}`;
    setDownloadingKey(downloadKey);
    setError("");

    try {
      await downloadMarketplaceMaterial({
        id: item.id,
        format,
        fallbackFileName: item.fileName || `${item.title}.${format}`,
      });

      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, downloadsCount: candidate.downloadsCount + 1 }
            : candidate,
        ),
      );
      setSelected((current) =>
        current?.id === item.id
          ? { ...current, downloadsCount: current.downloadsCount + 1 }
          : current,
      );
      setStatus(`Download ${format.toUpperCase()} iniciado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar material.");
      setStatus("Falha no download.");
    } finally {
      setDownloadingKey(null);
    }
  }

  function toggleMineOnly() {
    const next = !mineOnly;
    setMineOnly(next);
    loadItems(next);
  }

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Comunidade"
          icon="market"
          title="Materiais compartilhados por professores"
          description="Baixe DOCX ou PDF com um clique — publique o que você cria e reutilize modelos alinhados à BNCC."
          action={
            <button
              type="button"
              onClick={() => setPublishOpen((open) => !open)}
              className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
            >
              {publishOpen ? "Fechar publicação" : "Publicar material"}
            </button>
          }
        />
      }
    >
      <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        {publishOpen ? (
          <section className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-950">
              Publicar na Comunidade
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Envie um material para outros professores premium baixarem.
            </p>

            {error ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Título do material"
                className={`${hudInput} sm:col-span-2`}
                required
              />
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Descrição breve do material e como usar em aula."
                className={`${hudInput} min-h-24 py-3 sm:col-span-2`}
                required
              />
              <select
                value={form.etapa}
                onChange={(event) => updateForm("etapa", event.target.value)}
                className={hudInput}
              >
                {etapaOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.anoSerie}
                onChange={(event) => updateForm("anoSerie", event.target.value)}
                className={hudInput}
              >
                {availableYears.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.componente}
                onChange={(event) => updateForm("componente", event.target.value)}
                className={hudInput}
              >
                {componenteOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                value={form.tipoMaterial}
                onChange={(event) => updateForm("tipoMaterial", event.target.value)}
                className={hudInput}
              >
                {tipoMaterialOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                value={form.tema}
                onChange={(event) => updateForm("tema", event.target.value)}
                placeholder="Tema/conteúdo"
                className={hudInput}
              />
              <input
                value={form.authorName}
                onChange={(event) => updateForm("authorName", event.target.value)}
                placeholder="Nome do autor"
                className={hudInput}
              />
              <input
                value={form.tags}
                onChange={(event) => updateForm("tags", event.target.value)}
                placeholder="Tags (vírgula)"
                className={`${hudInput} sm:col-span-2`}
              />
              <label className="rounded-xl border border-dashed border-cyan-400/25 bg-white/60 p-4 sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                  Arquivo
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.html,.htm,.txt,.zip"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
                  required
                />
                {file ? (
                  <span className="mt-2 block text-xs text-slate-600">
                    {file.name} — {formatBytes(file.size)}
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-slate-500">
                    HTML, DOCX ou PDF recomendados para DOCX/PDF automáticos.
                  </span>
                )}
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => updateForm("isPublished", event.target.checked)}
                  className="h-4 w-4 accent-cyan-600"
                />
                Publicar imediatamente
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "Publicando..." : "Publicar na Comunidade"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="pl-hud-btn-secondary rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  Limpar
                </button>
              </div>
            </form>
          </section>
        ) : null}

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
                  placeholder="Tema, professor, componente..."
                  className={`${hudInput} pl-9`}
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Etapa</span>
              <select
                value={etapaFilter}
                onChange={(event) => setEtapaFilter(event.target.value)}
                className={hudInput}
              >
                <option value="Todas">Todas</option>
                {etapaOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={toggleMineOnly}
              className="pl-hud-btn-secondary h-11 rounded-xl px-4 text-xs font-semibold"
            >
              {mineOnly ? "Ver todos" : "Meus materiais"}
            </button>
            <button
              type="button"
              onClick={() => loadItems(mineOnly)}
              className="pl-hud-btn h-11 rounded-xl px-4 text-xs font-semibold"
            >
              Atualizar
            </button>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">{status}</p>
        </section>

        {loading && items.length === 0 ? (
          <div className="pl-hud-glass flex items-center justify-center rounded-2xl p-12">
            <span className="text-sm font-semibold text-cyan-700">
              Carregando Comunidade...
            </span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <article
                  key={item.id}
                  className={`pl-hud-hub-app flex min-h-[16rem] flex-col rounded-2xl p-4 transition ${
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
                      {item.tipoMaterial}
                    </span>
                    <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {item.description}
                    </p>
                    <div className="mt-auto space-y-1 pt-3 text-[11px] font-medium text-slate-500">
                      <p className="font-semibold text-slate-700">{item.authorName}</p>
                      <p>
                        {item.componente} · {item.etapa} · {item.anoSerie}
                      </p>
                      <p>
                        {formatBytes(item.fileSize)}
                        {item.downloadsCount > 0
                          ? ` · ${item.downloadsCount} download(s)`
                          : ""}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 border-t border-cyan-400/10 pt-3">
                    <MaterialDownloadButtons
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
              Comunidade vazia
            </p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-950">
              Nenhum material compartilhado ainda
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              Seja o primeiro a publicar — ou ajuste os filtros de busca.
            </p>
            <button
              type="button"
              onClick={() => setPublishOpen(true)}
              className="pl-hud-btn mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold"
            >
              Publicar material
            </button>
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
                ["Autor", selected.authorName],
                ["Componente", selected.componente],
                ["Etapa", `${selected.etapa} · ${selected.anoSerie}`],
                ["Tipo", selected.tipoMaterial],
                ["Tema", selected.tema || "—"],
                ["Publicado", formatDate(selected.createdAt) || "—"],
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

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <MaterialDownloadButtons
                item={selected}
                downloadingKey={downloadingKey}
                onDownload={handleDownload}
              />
              <button
                type="button"
                onClick={() => removeItem(selected)}
                disabled={loading}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                Remover meu material
              </button>
            </div>

            <div className="mt-6 border-t border-cyan-400/10 pt-5">
              <MarketplaceComments materialId={selected.id} />
            </div>
          </section>
        ) : null}

        {error && !publishOpen ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}
      </div>
    </PlanifyWorkspacePane>
  );
}

export default MarketplaceClient;
