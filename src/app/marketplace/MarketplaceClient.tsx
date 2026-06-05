"use client";

import { MarketplaceComments } from "@/components/marketplace/MarketplaceComments";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
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

export function MarketplaceClient() {
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [selected, setSelected] = useState<MarketplaceItem | null>(null);
  const [query, setQuery] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("Todas");
  const [mineOnly, setMineOnly] = useState(false);
  const [status, setStatus] = useState("Carregando Marketplace...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const availableYears = anoSerieOptions[form.etapa] || ["Geral"];

  async function loadItems(nextMineOnly = mineOnly) {
    setLoading(true);
    setError("");
    setStatus("Carregando materiais compartilhados...");

    try {
      const response = await fetch(
        `/api/marketplace/materiais${nextMineOnly ? "?mine=true" : ""}`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar o Marketplace.");
      }

      const remoteItems = Array.isArray(data.items) ? data.items : [];
      setItems(remoteItems);
      setSelected(remoteItems[0] || null);
      setStatus(
        nextMineOnly
          ? `${remoteItems.length} material(is) publicado(s) por você.`
          : `${remoteItems.length} material(is) disponível(is) no Marketplace.`,
      );
    } catch (err) {
      setItems([]);
      setSelected(null);
      setError(err instanceof Error ? err.message : "Erro ao carregar Marketplace.");
      setStatus("Marketplace indisponível no momento.");
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
      const next = {
        ...current,
        [key]: value,
      };

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
      setError("Anexe um arquivo para compartilhar no Marketplace.");
      return;
    }

    setLoading(true);
    setStatus("Publicando material no Marketplace...");

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
      setStatus("Material publicado no Marketplace com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar material.");
      setStatus("Falha ao publicar.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item: MarketplaceItem) {
    const confirmed = window.confirm(`Remover "${item.title}" do Marketplace?`);

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
          badge="Marketplace"
          icon="market"
          title="Compartilhe com a comunidade"
          description="Publique materiais pedagógicos para outras professoras premium."
        />
      }
    >
    <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="space-y-6">
        <div className="rounded-[1.85rem] border border-slate-100/70 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-600">
                Publicar
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Novo material
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500/90">
                Envie um material pedagógico para outros professores premium baixarem.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Limpar
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Título do material"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
              required
            />

            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Descrição breve do material e como usar em aula."
              className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.etapa}
                onChange={(event) => updateForm("etapa", event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-slate-950 focus:bg-white"
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
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-slate-950 focus:bg-white"
              >
                {availableYears.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.componente}
                onChange={(event) => updateForm("componente", event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-slate-950 focus:bg-white"
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
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-slate-950 focus:bg-white"
              >
                {tipoMaterialOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={form.tema}
              onChange={(event) => updateForm("tema", event.target.value)}
              placeholder="Tema/conteúdo"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
            />

            <input
              value={form.authorName}
              onChange={(event) => updateForm("authorName", event.target.value)}
              placeholder="Nome do autor/professor"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
            />

            <input
              value={form.tags}
              onChange={(event) => updateForm("tags", event.target.value)}
              placeholder="Tags opcionais separadas por vírgula"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
            />

            <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-700">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-blue-700">
                Arquivo
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.zip"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-slate-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                required
              />
              {file ? (
                <span className="mt-3 block text-slate-600">
                  {file.name} — {formatBytes(file.size)}
                </span>
              ) : (
                <span className="mt-3 block text-slate-500">
                  DOCX, PDF, PPTX, XLSX, imagem, TXT ou ZIP.
                </span>
              )}
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => updateForm("isPublished", event.target.checked)}
                className="h-5 w-5 accent-slate-950"
              />
              Publicar imediatamente
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-slate-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Publicando..." : "Publicar no Marketplace"}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
            Filtros
          </p>

          <div className="mt-4 grid gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por tema, professor, componente..."
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:bg-white"
            />

            <select
              value={etapaFilter}
              onChange={(event) => setEtapaFilter(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-slate-950 focus:bg-white"
            >
              <option value="Todas">Todas as etapas</option>
              {etapaOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={toggleMineOnly}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              {mineOnly ? "Ver todos publicados" : "Ver meus materiais"}
            </button>

            <button
              type="button"
              onClick={() => loadItems(mineOnly)}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-slate-600 px-5 py-3 text-sm font-black text-white transition hover:opacity-95"
            >
              Atualizar
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {status}
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-700">
            Materiais compartilhados
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Troca entre professores
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Materiais reais publicados por professores premium.
          </p>

          <div className="mt-6 grid gap-4">
            {loading ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-blue-700">
                Carregando Marketplace...
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-1 ${
                    selected?.id === item.id
                      ? "border-slate-950 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-950"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                      {item.tipoMaterial}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span>{item.etapa}</span>
                    <span>• {item.anoSerie}</span>
                    <span>• {item.componente}</span>
                    {item.tema ? <span>• {item.tema}</span> : null}
                    <span>• {item.authorName}</span>
                    <span>• {formatBytes(item.fileSize)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-7">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-700">
                  Marketplace vazio
                </p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  Nenhum material compartilhado ainda.
                </h3>
                <p className="mt-3 text-sm leading-7 text-amber-700">
                  Publique o primeiro material para iniciar a troca entre professores.
                </p>
              </div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-700">
              Detalhes
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{selected.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {selected.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Autor", selected.authorName],
                ["Etapa", selected.etapa],
                ["Ano/Série", selected.anoSerie],
                ["Componente", selected.componente],
                ["Tipo", selected.tipoMaterial],
                ["Tema", selected.tema || "—"],
                ["Arquivo", selected.fileName || "—"],
                ["Tamanho", formatBytes(selected.fileSize)],
                ["Publicado em", formatDate(selected.createdAt) || "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {selected.fileName || selected.signedUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownload(selected, "docx")}
                    disabled={Boolean(downloadingKey)}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-slate-600 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingKey === `${selected.id}:docx`
                      ? "Gerando DOCX..."
                      : "Baixar DOCX"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(selected, "pdf")}
                    disabled={Boolean(downloadingKey)}
                    className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center text-sm font-black text-slate-900 transition hover:-translate-y-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingKey === `${selected.id}:pdf`
                      ? "Gerando PDF..."
                      : "Baixar PDF"}
                  </button>
                </>
              ) : (
                <span className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center text-sm font-black text-amber-700">
                  Anexo indisponível
                </span>
              )}

              <button
                type="button"
                onClick={() => removeItem(selected)}
                disabled={loading}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-black text-rose-700 transition hover:-translate-y-1 disabled:opacity-60"
              >
                Remover meu material
              </button>
            </div>

            <MarketplaceComments materialId={selected.id} />
          </div>
        ) : null}
      </div>
    </div>
    </PlanifyWorkspacePane>
  );
}

export default MarketplaceClient;
