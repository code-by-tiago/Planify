"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getMaterialMode,
  materialModes,
  type MaterialMode,
} from "@/lib/studio/planifyStudioConfig";

type Dificuldade = "facil" | "media" | "avancada";
type FormatoJogo =
  | "caca-palavras"
  | "cruzadinha"
  | "quiz"
  | "bingo"
  | "trilha"
  | "memoria";

type MaterialHistoryItem = {
  id: string;
  titulo: string;
  tipo: MaterialMode;
  tema: string;
  componente: string;
  anoSerie: string;
  html: string;
  createdAt: string;
};

const exemplosPorTipo: Record<MaterialMode, string[]> = {
  apostila: ["AmazÃ´nia e biodiversidade", "FraÃ§Ãµes no cotidiano", "Romantismo no Brasil"],
  atividade: ["InterpretaÃ§Ã£o de texto", "Sistema solar", "Porcentagem"],
  prova: ["RevoluÃ§Ã£o Industrial", "EquaÃ§Ãµes do 1Âº grau", "Ecologia"],
  slides: ["Estados fÃ­sicos da matÃ©ria", "Verbos", "Brasil RepÃºblica"],
  projeto: ["Feira de ciÃªncias", "ConsciÃªncia negra", "EducaÃ§Ã£o financeira"],
  jogo: ["Biomas brasileiros", "Tabuada", "Classes gramaticais"],
  sequencia: ["Leitura e produÃ§Ã£o textual", "Geometria plana", "Ãgua e sociedade"],
  resumo: ["Ciclo da Ã¡gua", "FotossÃ­ntese", "MÃ©dia, moda e mediana"],
};

const formatoJogos: { id: FormatoJogo; label: string; icon: string }[] = [
  { id: "caca-palavras", label: "CaÃ§a-palavras", icon: "ðŸ” " },
  { id: "cruzadinha", label: "Cruzadinha", icon: "âœš" },
  { id: "quiz", label: "Quiz", icon: "âš¡" },
  { id: "bingo", label: "Bingo", icon: "ðŸŽŸï¸" },
  { id: "trilha", label: "Trilha", icon: "ðŸ›¤ï¸" },
  { id: "memoria", label: "MemÃ³ria", icon: "ðŸƒ" },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  const clean = value.replace(/```html|```/g, "").trim();

  if (/<[a-z][\s\S]*>/i.test(clean)) {
    return clean;
  }

  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "<p>Material gerado sem conteÃºdo textual.</p>";
  }

  return lines
    .map((line) => {
      if (/^#{1,3}\s+/.test(line)) {
        return `<h2>${escapeHtml(line.replace(/^#{1,3}\s+/, ""))}</h2>`;
      }

      if (/^\d+[\).\s-]/.test(line) || /^[-â€¢]/.test(line)) {
        return `<p>${escapeHtml(line)}</p>`;
      }

      if (line.length < 86 && line === line.toUpperCase()) {
        return `<h2>${escapeHtml(line)}</h2>`;
      }

      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("\n");
}

function extractHtmlFromResponse(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }

  const record = data as Record<string, unknown>;
  const possibleFields = [
    "html",
    "conteudoHtml",
    "materialHtml",
    "documentoHtml",
    "content",
    "conteudo",
    "resultado",
    "texto",
    "material",
    "documento",
  ];

  for (const field of possibleFields) {
    const value = record[field];

    if (typeof value === "string" && value.trim()) {
      return textToHtml(value);
    }

    if (value && typeof value === "object") {
      const nested = extractHtmlFromResponse(value);
      if (nested) {
        return nested;
      }
    }
  }

  return "";
}

function buildTitle(mode: MaterialMode, tema: string) {
  const config = getMaterialMode(mode);
  return `${config.shortTitle} â€” ${tema || "Material Planify"}`;
}

export default function MateriaisPage() {
  const [tipo, setTipo] = useState<MaterialMode>("apostila");
  const [tema, setTema] = useState("");
  const [etapa, setEtapa] = useState("Ensino Fundamental");
  const [anoSerie, setAnoSerie] = useState("");
  const [componente, setComponente] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [quantidade, setQuantidade] = useState("10");
  const [dificuldade, setDificuldade] = useState<Dificuldade>("media");
  const [formatoJogo, setFormatoJogo] = useState<FormatoJogo>("caca-palavras");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [resultadoHtml, setResultadoHtml] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipoUrl = params.get("tipo");
    if (materialModes.some((mode) => mode.id === tipoUrl)) {
      setTipo(tipoUrl as MaterialMode);
    }
  }, []);

  const mode = useMemo(() => getMaterialMode(tipo), [tipo]);
  const isJogo = tipo === "jogo";
  const exemplos = exemplosPorTipo[tipo];

  function limparTudo() {
    setTema("");
    setAnoSerie("");
    setComponente("");
    setObjetivo("");
    setQuantidade("10");
    setDificuldade("media");
    setFormatoJogo("caca-palavras");
    setIncluirGabarito(true);
    setResultadoHtml("");
    setErro("");
  }

  function salvarHistorico(html: string) {
    const item: MaterialHistoryItem = {
      id: `${Date.now()}`,
      titulo: buildTitle(tipo, tema),
      tipo,
      tema,
      componente,
      anoSerie,
      html,
      createdAt: new Date().toISOString(),
    };

    const keys = [
      "planify-historico-materiais",
      "planify_historico_materiais",
      "planifyHistoricoMateriais",
    ];

    keys.forEach((key) => {
      try {
        const current = JSON.parse(localStorage.getItem(key) || "[]");
        const list = Array.isArray(current) ? current : [];
        localStorage.setItem(key, JSON.stringify([item, ...list].slice(0, 50)));
      } catch {
        localStorage.setItem(key, JSON.stringify([item]));
      }
    });
  }

  function abrirNoEditor() {
    if (!resultadoHtml) {
      setErro("Gere um material antes de abrir no editor.");
      return;
    }

    const documento = {
      titulo: buildTitle(tipo, tema),
      tipo: "material-didatico",
      subtipo: tipo,
      tema,
      componente,
      anoSerie,
      html: resultadoHtml,
      conteudoHtml: resultadoHtml,
      origem: "materiais",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("planify-editor-document", JSON.stringify(documento));
    localStorage.setItem("planifyEditorDocument", JSON.stringify(documento));
    localStorage.setItem("documentoEditor", JSON.stringify(documento));
    localStorage.setItem("editorContent", resultadoHtml);
    window.location.href = "/editor";
  }

  function baixarWord() {
    if (!resultadoHtml) {
      setErro("Gere um material antes de baixar.");
      return;
    }

    const titulo = buildTitle(tipo, tema).replace(/[\\/:*?"<>|]/g, "-");
    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(titulo)}</title>
<style>
body{font-family:Arial,sans-serif;line-height:1.45;color:#111827;padding:32px;}
h1,h2,h3{color:#0f172a;}
table{border-collapse:collapse;width:100%;}
td,th{border:1px solid #d1d5db;padding:8px;}
.section{margin:20px 0;}
</style>
</head>
<body>${resultadoHtml}</body>
</html>`;

    const blob = new Blob([html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${titulo}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function gerarMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!tema.trim()) {
      setErro("Informe o tema para gerar o material.");
      return;
    }

    if (!anoSerie.trim()) {
      setErro("Informe o ano/sÃ©rie para adequar a linguagem.");
      return;
    }

    if (!componente.trim()) {
      setErro("Informe o componente curricular.");
      return;
    }

    setLoading(true);
    setResultadoHtml("");

    try {
      const payload = {
        tipoMaterial: tipo,
        tipo,
        etapa,
        anoSerie,
        componenteCurricular: componente,
        componente,
        tema,
        temaCentral: tema,
        objetivo,
        objetivos: objetivo,
        quantidade,
        dificuldade,
        formatoJogo: isJogo ? formatoJogo : null,
        incluirGabarito,
        orientacaoDeQualidade:
          "Gerar material pedagÃ³gico profissional, bem estruturado, sem misturar formatos, pronto para ediÃ§Ã£o e impressÃ£o.",
      };

      const response = await fetch("/api/materiais/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as { message?: unknown }).message)
            : "NÃ£o foi possÃ­vel gerar o material.";
        throw new Error(message);
      }

      const html = extractHtmlFromResponse(data);

      if (!html) {
        throw new Error(
          "A API respondeu, mas nÃ£o retornou conteÃºdo em um formato reconhecido."
        );
      }

      setResultadoHtml(html);
      salvarHistorico(html);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao gerar o material.";
      setErro(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0f9ff_0,#f8fafc_40%,#ffffff_100%)] text-slate-950">
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-white">
              {mode.icon}
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">
              {mode.loadingTitle}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {mode.loadingDescription}
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-slate-950" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white bg-white/85 px-5 py-4 shadow-xl shadow-slate-200 backdrop-blur">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 transition hover:text-slate-950"
            >
              â† Voltar ao Studio
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Gerador IA de Materiais
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={limparTudo}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Limpar tudo
            </button>
            <Link
              href="/editor"
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
            >
              Abrir Editor
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="rounded-[2.2rem] border border-white bg-white/90 p-4 shadow-xl shadow-slate-200 backdrop-blur">
            <div className="mb-4 px-2">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                Escolha o que criar
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Cada tipo usa estrutura prÃ³pria. Jogos nÃ£o aparecem misturados
                com apostilas ou atividades.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {materialModes.map((item) => {
                const active = item.id === tipo;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTipo(item.id);
                      setResultadoHtml("");
                      setErro("");
                    }}
                    className={`group rounded-3xl border p-4 text-left transition hover:-translate-y-1 ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-300"
                        : "border-slate-100 bg-white text-slate-950 hover:border-slate-950 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl">{item.icon}</span>
                      {active ? (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">
                          Ativo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm font-black">{item.shortTitle}</p>
                    <p
                      className={`mt-1 line-clamp-2 text-xs leading-5 ${
                        active ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="grid gap-4 lg:grid-rows-[auto_1fr]">
            <form
              onSubmit={gerarMaterial}
              className="rounded-[2.2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200"
            >
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div
                    className={`mb-3 inline-flex rounded-full bg-gradient-to-r ${mode.accent} px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white`}
                  >
                    {mode.icon} {mode.title}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    FormulÃ¡rio inteligente
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Preencha sÃ³ o essencial. A IA organiza o formato correto.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    {mode.primaryFieldLabel}
                  </span>
                  <input
                    value={tema}
                    onChange={(event) => setTema(event.target.value)}
                    placeholder="Ex.: AmazÃ´nia, fraÃ§Ãµes, ecologia, interpretaÃ§Ã£o de texto..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Etapa
                  </span>
                  <select
                    value={etapa}
                    onChange={(event) => setEtapa(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  >
                    <option>EducaÃ§Ã£o Infantil</option>
                    <option>Ensino Fundamental</option>
                    <option>Ensino MÃ©dio</option>
                    <option>EJA</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Ano/SÃ©rie
                  </span>
                  <input
                    value={anoSerie}
                    onChange={(event) => setAnoSerie(event.target.value)}
                    placeholder="Ex.: 6Âº ano, 1Âª sÃ©rie EM..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Componente curricular
                  </span>
                  <input
                    value={componente}
                    onChange={(event) => setComponente(event.target.value)}
                    placeholder="Ex.: Geografia, MatemÃ¡tica, LÃ­ngua Portuguesa..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Dificuldade
                  </span>
                  <select
                    value={dificuldade}
                    onChange={(event) =>
                      setDificuldade(event.target.value as Dificuldade)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  >
                    <option value="facil">FÃ¡cil</option>
                    <option value="media">MÃ©dia</option>
                    <option value="avancada">AvanÃ§ada</option>
                  </select>
                </label>

                {isJogo ? (
                  <label>
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      Tipo de jogo
                    </span>
                    <select
                      value={formatoJogo}
                      onChange={(event) =>
                        setFormatoJogo(event.target.value as FormatoJogo)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                    >
                      {formatoJogos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.icon} {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      Quantidade/ExtensÃ£o
                    </span>
                    <input
                      value={quantidade}
                      onChange={(event) => setQuantidade(event.target.value)}
                      placeholder="Ex.: 10 questÃµes, 8 pÃ¡ginas, 12 slides..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                    />
                  </label>
                )}

                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Objetivo ou observaÃ§Ã£o opcional
                  </span>
                  <textarea
                    value={objetivo}
                    onChange={(event) => setObjetivo(event.target.value)}
                    placeholder="Ex.: material para revisÃ£o, linguagem simples, incluir exemplos do cotidiano, foco em interpretaÃ§Ã£o..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  />
                </label>
              </div>

              {isJogo ? (
                <div className="mt-4 rounded-3xl border border-fuchsia-100 bg-fuchsia-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    Ãrea de jogos ativada
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    O formulÃ¡rio normal foi adaptado para jogos. A geraÃ§Ã£o vai
                    criar regras, versÃ£o do aluno e gabarito do jogo escolhido.
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {exemplos.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTema(item)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={incluirGabarito}
                    onChange={(event) => setIncluirGabarito(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Incluir gabarito/soluÃ§Ã£o
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gerar com IA
                </button>
              </div>

              {erro ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {erro}
                </div>
              ) : null}
            </form>

            <div className="min-h-[360px] rounded-[2.2rem] border border-white bg-white p-5 shadow-xl shadow-slate-200">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                    Resultado
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    PrÃ©via editÃ¡vel
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={abrirNoEditor}
                    disabled={!resultadoHtml}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Abrir no Editor
                  </button>
                  <button
                    type="button"
                    onClick={baixarWord}
                    disabled={!resultadoHtml}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Baixar .doc
                  </button>
                </div>
              </div>

              {resultadoHtml ? (
                <article
                  className="prose prose-slate max-w-none rounded-3xl border border-slate-100 bg-slate-50 p-5"
                  dangerouslySetInnerHTML={{ __html: resultadoHtml }}
                />
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm">
                    {mode.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    Seu material aparecerÃ¡ aqui
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Escolha o tipo, informe tema, sÃ©rie e componente. O Planify
                    vai gerar uma estrutura compatÃ­vel com o formato escolhido.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}