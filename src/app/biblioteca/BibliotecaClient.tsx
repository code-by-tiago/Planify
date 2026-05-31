"use client";

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

export function BibliotecaClient() {
  const [query, setQuery] = useState("");
  const [etapa, setEtapa] = useState("Todas");
  const [tipo, setTipo] = useState("Todos");
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [selected, setSelected] = useState<BibliotecaItem | null>(null);
  const [status, setStatus] = useState("Carregando Biblioteca Premium...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPremiumMaterials() {
    setLoading(true);
    setError("");
    setStatus("Carregando materiais selecionados para professores...");

    try {
      const response = await fetch("/api/biblioteca/materiais", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setItems([]);
        setSelected(null);
        setError(data?.error?.message || "A Biblioteca Premium exige login com plano ativo.");
        setStatus("Acesso premium necessário.");
        return;
      }

      const remoteItems = Array.isArray(data.items) ? data.items : [];

      setItems(remoteItems);
      setSelected(remoteItems[0] || null);

      if (remoteItems.length > 0) {
        setStatus(`${remoteItems.length} material(is) premium disponível(is).`);
      } else {
        setStatus("Nenhum material real foi cadastrado ainda.");
      }
    } catch (err) {
      setItems([]);
      setSelected(null);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar a Biblioteca Premium.",
      );
      setStatus("Biblioteca Premium indisponível no momento.");
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
      const matchTipo = tipo === "Todos" || itemType === tipo || item.categoria === tipo;

      return matchSearch && matchEtapa && matchTipo;
    });
  }, [items, query, etapa, tipo]);

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.78fr_1.22fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
            Biblioteca Premium
          </p>
          <h1 className="mt-4 text-3xl font-black text-white">
            Acervo oficial do Planify
          </h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Aqui aparecem apenas materiais pedagógicos reais disponíveis na Biblioteca Premiumistrador.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-7 text-cyan-100/85">
            {status}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
              {error}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a
                  href="/login?redirect=/biblioteca&premium=required"
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950"
                >
                  Fazer login
                </a>
                <a
                  href="/planos"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-black text-white"
                >
                  Ver planos
                </a>
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {[
              ["Materiais reais", String(items.length)],
              ["Filtrados", String(filteredItems.length)],
              ["Fonte", "Admin"],
              ["Acesso", "Premium"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Filtros
          </p>

          <div className="mt-4 grid gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por tema, componente, série ou tag"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
            />

            <select
              value={etapa}
              onChange={(event) => setEtapa(event.target.value)}
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
            >
              {etapaOptions.map((item) => (
                <option key={item} value={item} className="bg-slate-950">
                  {item}
                </option>
              ))}
            </select>

            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/50"
            >
              {tipoOptions.map((item) => (
                <option key={item} value={item} className="bg-slate-950">
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadPremiumMaterials}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Atualizar biblioteca
            </button>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Materiais oficiais
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Recursos enviados pela curadoria Planify
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Materiais cadastrados em /admin/biblioteca aparecem aqui para usuários premium.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {loading ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-sm leading-7 text-cyan-100">
                Carregando materiais reais da Biblioteca Premium...
              </div>
            ) : filteredItems.length > 0 ? (
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
                      {item.tipoMaterial || item.categoria}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                    <span>{item.etapa}</span>
                    {item.anoSerie ? <span>• {item.anoSerie}</span> : null}
                    <span>• {item.componente}</span>
                    {item.tema ? <span>• {item.tema}</span> : null}
                    {item.fileSize ? <span>• {formatBytes(item.fileSize)}</span> : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-amber-300/20 bg-amber-300/10 p-7">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">
                  Biblioteca vazia
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Nenhum material real foi cadastrado ainda.
                </h3>
                <p className="mt-3 text-sm leading-7 text-amber-100/85">
                  Assim que o administrador publicar materiais, eles aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Visualização
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
                ["Tipo", selected.tipoMaterial || selected.categoria],
                ["Tema", selected.tema || "—"],
                ["Arquivo", selected.fileName || "—"],
                ["Tamanho", formatBytes(selected.fileSize) || "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openInEditor(selected)}
                className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
              >
                Abrir no Editor
              </button>

              {selected.signedUrl ? (
                <a
                  href={selected.signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Baixar anexo
                </a>
              ) : (
                <span className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-6 py-4 text-center text-sm font-black text-amber-100">
                  Anexo indisponível
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BibliotecaClient;

