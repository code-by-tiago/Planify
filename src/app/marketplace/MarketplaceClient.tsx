"use client";

import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CommunityFriendsPanel } from "@/components/community/CommunityFriendsPanel";
import { CommunityMessagesIcon } from "@/components/community/CommunityMessagesIcon";
import { CommunityNotificationsIcon } from "@/components/community/CommunityNotificationsIcon";
import { CommunityPolicyLink } from "@/components/community/CommunityPolicyModal";
import { CommunityProfilePanel } from "@/components/community/CommunityProfilePanel";
import { CommunityTeacherSearch } from "@/components/community/CommunityTeacherSearch";
import type { CommunityFeedItem } from "@/lib/community/types";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  downloadMarketplaceMaterial,
  type MarketplaceDownloadFormat,
} from "@/lib/marketplace/marketplace-download-client";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type MarketplaceItem = CommunityFeedItem;

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

export function MarketplaceClient() {
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("Todas");
  const [componenteFilter, setComponenteFilter] = useState("Todos");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [tagFilter, setTagFilter] = useState("");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [status, setStatus] = useState("Carregando Comunidade...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const availableYears = anoSerieOptions[form.etapa] || ["Geral"];

  function buildFeedQuery(nextMineOnly = mineOnly) {
    const params = new URLSearchParams();
    if (nextMineOnly) params.set("mine", "true");
    if (friendsOnly) params.set("friendsOnly", "true");
    if (savedOnly) params.set("saved", "true");
    if (componenteFilter !== "Todos") params.set("componente", componenteFilter);
    if (etapaFilter !== "Todas") params.set("etapa", etapaFilter);
    if (tipoFilter !== "Todos") params.set("tipoMaterial", tipoFilter);
    if (tagFilter.trim()) params.set("tag", tagFilter.trim());
    params.set("featured", "week");
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }

  async function loadItems(nextMineOnly = mineOnly) {
    setLoading(true);
    setError("");
    setStatus("Carregando materiais compartilhados...");

    try {
      const response = await fetch(`/api/marketplace/materiais${buildFeedQuery(nextMineOnly)}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar a Comunidade.");
      }

      const remoteItems = Array.isArray(data.items) ? data.items : [];
      const remoteFeatured = Array.isArray(data.featured) ? data.featured : [];
      setItems(remoteItems);
      setFeaturedItems(nextMineOnly || savedOnly ? [] : remoteFeatured);
      setCurrentUserId(String(data.access?.userId || "") || null);
      setStatus(
        nextMineOnly
          ? `${remoteItems.length} material(is) publicado(s) por você.`
          : `${remoteItems.length} material(is) na Comunidade.`,
      );
    } catch (err) {
      setItems([]);
      setFeaturedItems([]);
      setError(err instanceof Error ? err.message : "Erro ao carregar Comunidade.");
      setStatus("Comunidade indisponível no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems(mineOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componenteFilter, etapaFilter, tipoFilter, tagFilter, friendsOnly, savedOnly, mineOnly]);

  const filteredItems = useMemo(() => {
    const search = normalize(query);
    return items.filter((item) => {
      const matchSearch =
        !search ||
        normalize(
          `${item.title} ${item.description} ${item.etapa} ${item.anoSerie} ${item.componente} ${item.tipoMaterial} ${item.tema} ${item.authorName} ${item.tags.join(" ")}`,
        ).includes(search);
      return matchSearch;
    });
  }, [items, query]);

  const filteredFeatured = useMemo(() => {
    const search = normalize(query);
    if (!search) return featuredItems;
    return featuredItems.filter((item) =>
      normalize(
        `${item.title} ${item.description} ${item.etapa} ${item.componente} ${item.tema} ${item.authorName}`,
      ).includes(search),
    );
  }, [featuredItems, query]);

  function applyTagFilter(tag: string) {
    setTagFilter(tag);
    setSavedOnly(false);
    setMineOnly(false);
  }

  function applyTemaFilter(tema: string) {
    setQuery(tema);
    setTagFilter("");
  }

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
    if (next) {
      setFriendsOnly(false);
      setSavedOnly(false);
    }
    setMineOnly(next);
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
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <CommunityNotificationsIcon className="col-span-1 w-full justify-center sm:w-auto" />
              <CommunityMessagesIcon className="col-span-1 w-full justify-center sm:w-auto" />
              <CommunityTeacherSearch className="col-span-2 sm:col-span-1" />
              <button
                type="button"
                onClick={() => setPublishOpen((open) => !open)}
                className="pl-hud-btn col-span-2 rounded-xl px-4 py-2 text-xs font-semibold sm:col-span-1"
              >
                {publishOpen ? "Fechar publicação" : "Publicar material"}
              </button>
            </div>
          }
        />
      }
    >
      <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        <CommunityProfilePanel />
        <CommunityFriendsPanel />

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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Componente</span>
              <select
                value={componenteFilter}
                onChange={(event) => setComponenteFilter(event.target.value)}
                className={hudInput}
              >
                <option value="Todos">Todos</option>
                {componenteOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Tipo</span>
              <select
                value={tipoFilter}
                onChange={(event) => setTipoFilter(event.target.value)}
                className={hudInput}
              >
                <option value="Todos">Todos</option>
                {tipoMaterialOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleMineOnly}
              className={`pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold ${mineOnly ? "ring-2 ring-cyan-400" : ""}`}
            >
              {mineOnly ? "Ver todos" : "Meus materiais"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFriendsOnly((value) => !value);
                setMineOnly(false);
                setSavedOnly(false);
              }}
              className={`pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold ${friendsOnly ? "ring-2 ring-cyan-400" : ""}`}
            >
              {friendsOnly ? "Todos os professores" : "Só amigos"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedOnly((value) => !value);
                setMineOnly(false);
                setFriendsOnly(false);
              }}
              className={`pl-hud-btn-secondary rounded-xl px-4 py-2 text-xs font-semibold ${savedOnly ? "ring-2 ring-cyan-400" : ""}`}
            >
              {savedOnly ? "Ver feed completo" : "Biblioteca salva"}
            </button>
            <button
              type="button"
              onClick={() => loadItems(mineOnly)}
              className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Atualizar
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">{status}</p>
            <CommunityPolicyLink />
          </div>
        </section>

        <CommunityFeed
          items={filteredItems}
          featuredItems={filteredFeatured}
          loading={loading}
          downloadingKey={downloadingKey}
          onDownload={handleDownload}
          onRemove={removeItem}
          mineOnly={mineOnly}
          currentUserId={currentUserId}
          onPublishClick={() => setPublishOpen(true)}
          onTagClick={applyTagFilter}
          onTemaClick={applyTemaFilter}
        />

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
