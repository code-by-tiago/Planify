"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type LibraryMaterial = {
  id: string;
  title: string;
  description: string;
  etapa: string;
  areaConhecimento: string;
  anoSerie: string;
  categoria: string;
  tipoMaterial: string;
  componente: string;
  tema: string;
  finalidade: string;
  nivelDificuldade: string;
  duracao: string;
  habilidadesBncc: string[];
  observacoes: string;
  tags: string[];
  fileName: string;
  fileMime: string;
  fileSize: number;
  isPublished: boolean;
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
    isPublished: true,
  };
}

function formatBytes(value: number) {
  if (!value) return "0 KB";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function AdminBibliotecaClient() {
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<LibraryMaterial[]>([]);
  const [selected, setSelected] = useState<LibraryMaterial | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Biblioteca Admin pronta para cadastro.");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableYears = anoSerieOptions[form.etapa] || ["Geral"];

  async function loadItems() {
    setError("");
    setStatus("Carregando materiais cadastrados...");

    try {
      const response = await fetch("/api/admin/biblioteca/materiais", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Não foi possível carregar os materiais cadastrados.",
        );
      }

      const remoteItems = data.items || [];
      setItems(remoteItems);
      setSelected(remoteItems[0] || null);
      setStatus(`${remoteItems.length} material(is) cadastrado(s).`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar materiais cadastrados.",
      );
      setStatus("Lista indisponível no momento. O cadastro pode ser tentado novamente.");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const search = normalize(query);

    return items.filter((item) => {
      if (!search) return true;

      return normalize(
        `${item.title} ${item.description} ${item.etapa} ${item.anoSerie} ${item.tipoMaterial} ${item.componente} ${item.tema} ${item.tags.join(" ")}`,
      ).includes(search);
    });
  }, [items, query]);

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
    setStatus("Formulário limpo. Pronto para novo material.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Anexe o arquivo do material antes de cadastrar.");
      return;
    }

    setLoading(true);
    setStatus("Enviando material para a Biblioteca Premium...");

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
      body.set("isPublished", String(form.isPublished));
      body.set("file", file);

      const response = await fetch("/api/admin/biblioteca/materiais", {
        method: "POST",
        body,
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            "Não foi possível cadastrar o material.",
        );
      }

      const newItem = data.item as LibraryMaterial;
      setForm(createInitialForm());
      setFile(null);
      setItems((current) => [newItem, ...current]);
      setSelected(newItem);
      setStatus("Material cadastrado e publicado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao cadastrar material.",
      );
      setStatus("Falha no cadastro. Revise o arquivo e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item: LibraryMaterial) {
    const confirmed = window.confirm(
      `Remover o material "${item.title}" da Biblioteca Premium?`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Removendo material...");

    try {
      const response = await fetch(`/api/admin/biblioteca/materiais?id=${item.id}`, {
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

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.8fr_1.2fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Upload oficial
              </p>
              <h2 className="mt-4 text-3xl font-black text-white">
                Cadastrar material
              </h2>
              <p className="mt-3 text-sm leading-7 text-cyan-100/85">
                Preencha o básico, anexe o arquivo e publique na Biblioteca Premium.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Limpar
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Título do material"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              required
            />

            <textarea
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Descrição curta. Ex.: Atividade de interpretação com gabarito para 5º ano."
              className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.etapa}
                onChange={(event) => updateForm("etapa", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                {etapaOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={form.anoSerie}
                onChange={(event) => updateForm("anoSerie", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                {availableYears.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.componente}
                onChange={(event) => updateForm("componente", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                {componenteOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={form.tipoMaterial}
                onChange={(event) => updateForm("tipoMaterial", event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
              >
                {tipoMaterialOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <input
              value={form.tema}
              onChange={(event) => updateForm("tema", event.target.value)}
              placeholder="Tema/conteúdo. Ex.: Frações, leitura, biomas..."
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
            />

            <input
              value={form.tags}
              onChange={(event) => updateForm("tags", event.target.value)}
              placeholder="Tags opcionais separadas por vírgula"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
            />

            <label className="rounded-2xl border border-dashed border-cyan-300/30 bg-slate-950/50 p-5 text-sm font-bold text-cyan-100">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Arquivo do material
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt,.zip"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="mt-3 block w-full text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950"
                required
              />
              {file ? (
                <span className="mt-3 block text-slate-300">
                  {file.name} — {formatBytes(file.size)}
                </span>
              ) : (
                <span className="mt-3 block text-slate-400">
                  DOCX, PDF, PPTX, XLSX, imagem, TXT ou ZIP.
                </span>
              )}
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-white">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => updateForm("isPublished", event.target.checked)}
                className="h-5 w-5"
              />
              Publicar imediatamente na Biblioteca Premium
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Cadastrando..." : "Cadastrar material"}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Status
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{status}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Materiais cadastrados
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Biblioteca Premium
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Materiais reais publicados por você para os professores premium.
              </p>
            </div>

            <button
              type="button"
              onClick={loadItems}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Atualizar
            </button>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar material cadastrado"
            className="mt-6 h-12 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
          />

          <div className="mt-6 grid gap-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-1 ${
                    selected?.id === item.id
                      ? "border-cyan-300/40 bg-cyan-300/10"
                      : "border-white/10 bg-slate-950/45 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-400">
                        {item.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
                      {item.isPublished ? "Publicado" : "Rascunho"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                    <span>{item.etapa}</span>
                    <span>•</span>
                    <span>{item.anoSerie || "Geral"}</span>
                    <span>•</span>
                    <span>{item.componente}</span>
                    <span>•</span>
                    <span>{item.tipoMaterial}</span>
                    <span>•</span>
                    <span>{formatBytes(item.fileSize)}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-100">
                Nenhum material cadastrado ou encontrado.
              </div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Detalhes
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">{selected.title}</h2>
            <p className="mt-4 text-sm leading-7 text-cyan-100/85">
              {selected.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Etapa", selected.etapa],
                ["Ano/Série", selected.anoSerie || "Geral"],
                ["Componente", selected.componente],
                ["Tipo", selected.tipoMaterial],
                ["Tema", selected.tema || "—"],
                ["Arquivo", selected.fileName],
                ["Tamanho", formatBytes(selected.fileSize)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">{value || "—"}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {selected.signedUrl ? (
                <a
                  href={selected.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Baixar anexo
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => removeItem(selected)}
                disabled={loading}
                className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-6 py-4 text-sm font-black text-rose-100 transition hover:-translate-y-1 hover:bg-rose-300/20 disabled:opacity-60"
              >
                Remover material
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default AdminBibliotecaClient;
