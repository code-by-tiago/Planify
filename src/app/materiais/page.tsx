"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PremiumAccessGate from "@/components/premium/PremiumAccessGate";
import {
  getMaterialMode,
  materialCategories,
  materialModes,
  type MaterialCategory,
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

const formatoJogos: { id: FormatoJogo; label: string; icon: string }[] = [
  { id: "caca-palavras", label: "Caça-palavras", icon: "🔠" },
  { id: "cruzadinha", label: "Cruzadinha", icon: "✚" },
  { id: "quiz", label: "Quiz", icon: "⚡" },
  { id: "bingo", label: "Bingo", icon: "🎟️" },
  { id: "trilha", label: "Trilha", icon: "🛤️" },
  { id: "memoria", label: "Memória", icon: "🃏" },
];

const sugestoesTema: Record<MaterialMode, string[]> = {
  apostila: ["Amazônia e biodiversidade", "Frações no cotidiano", "Romantismo no Brasil"],
  atividade: ["Interpretação de texto", "Sistema solar", "Porcentagem"],
  prova: ["Revolução Industrial", "Equações do 1º grau", "Ecologia"],
  slides: ["Estados físicos da matéria", "Verbos", "Brasil República"],
  projeto: ["Feira de ciências", "Consciência negra", "Educação financeira"],
  jogo: ["Biomas brasileiros", "Tabuada", "Classes gramaticais"],
  sequencia: ["Leitura e produção textual", "Geometria plana", "Água e sociedade"],
  resumo: ["Ciclo da água", "Fotossíntese", "Média, moda e mediana"],
  lista: ["Funções do 1º grau", "Sistema digestório", "Crase"],
  "plano-aula": ["Amazônia", "Porcentagem", "Gêneros textuais"],
  flashcards: ["Revolução Francesa", "Ecossistemas", "Classes de palavras"],
  redacao: ["Meio ambiente", "Tecnologia na educação", "Cidadania digital"],
  "mapa-mental": ["Fotossíntese", "Brasil Colônia", "Figuras de linguagem"],
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string): string {
  const clean = value.replace(/```html|```/g, "").trim();

  if (/<[a-z][\s\S]*>/i.test(clean)) {
    return clean;
  }

  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "<p>Material gerado sem conteúdo textual.</p>";
  }

  return lines
    .map((line) => {
      if (/^#{1,3}\s+/.test(line)) {
        return `<h2>${escapeHtml(line.replace(/^#{1,3}\s+/, ""))}</h2>`;
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

function buildTitle(mode: MaterialMode, tema: string): string {
  const config = getMaterialMode(mode);
  return `${config.shortTitle} — ${tema || "Material Planify"}`;
}

function MateriaisStudio() {
  const [categoria, setCategoria] = useState<MaterialCategory>("todos");
  const [tipo, setTipo] = useState<MaterialMode>("slides");
  const [modalAberto, setModalAberto] = useState(false);
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
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipoUrl = params.get("tipo");

    if (materialModes.some((mode) => mode.id === tipoUrl)) {
      setTipo(tipoUrl as MaterialMode);
      setModalAberto(true);
    }
  }, []);

  const mode = useMemo(() => getMaterialMode(tipo), [tipo]);
  const isJogo = tipo === "jogo";

  const ferramentasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();

    return materialModes.filter((item) => {
      const matchCategoria =
        categoria === "todos" || item.category === categoria;
      const matchBusca =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.shortTitle.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      return matchCategoria && matchBusca;
    });
  }, [busca, categoria]);

  function selecionarFerramenta(novoTipo: MaterialMode) {
    setTipo(novoTipo);
    setResultadoHtml("");
    setErro("");
    setModalAberto(true);
  }

  function limparFormulario() {
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
        const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown;
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
      setErro("Informe o ano/série para adequar a linguagem.");
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
          "Gerar material pedagógico profissional, bem estruturado, sem misturar formatos, pronto para edição e impressão.",
      };

      const response = await fetch("/api/materiais/gerar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "message" in data
            ? String((data as { message?: unknown }).message)
            : "Não foi possível gerar o material.";
        throw new Error(message);
      }

      const html = extractHtmlFromResponse(data);

      if (!html) {
        throw new Error(
          "A API respondeu, mas não retornou conteúdo em um formato reconhecido."
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
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <Link href="/dashboard" className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
              P
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">Planify</p>
              <p className="text-xs font-bold text-slate-400">Studio</p>
            </div>
          </Link>

          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              🏠 Início
            </Link>
            <Link
              href="/materiais"
              className="flex items-center gap-3 rounded-2xl bg-violet-50 px-3 py-3 text-sm font-black text-violet-700"
            >
              ✨ Materiais
            </Link>
            <Link
              href="/planejamentos"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              📋 Planejamentos
            </Link>
            <Link
              href="/editor"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              📝 Editor
            </Link>
            <Link
              href="/historico"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              🗂️ Histórico
            </Link>
            <Link
              href="/biblioteca"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              📚 Biblioteca
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              🤝 Marketplace
            </Link>
          </nav>

          <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">Acesso premium</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Ferramentas liberadas somente para contas com plano ativo.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700 transition hover:bg-slate-950 hover:text-white lg:hidden"
                >
                  P
                </Link>
                <div className="relative min-w-[220px] flex-1 max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Busque ferramentas, tópicos, materiais..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/planos"
                  className="hidden rounded-2xl bg-violet-100 px-4 py-2 text-sm font-black text-violet-700 sm:inline-flex"
                >
                  Planify Premium
                </Link>
                <Link
                  href="/editor"
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-200"
                >
                  Editor
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-emerald-100 via-lime-50 to-amber-50 p-5 shadow-sm">
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Novidade no Planify
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Crie materiais personalizados com IA
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-600">
                    Escolha uma ferramenta, preencha poucos campos e gere um
                    material com estrutura própria para o tipo selecionado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selecionarFerramenta("plano-aula")}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5"
                >
                  Criar aula agora
                </button>
              </div>
            </div>

            <div className="mt-5">
              <h2 className="text-xl font-black tracking-tight text-slate-950">
                Criar materiais personalizados com IA
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Selecionadas para você com base no fluxo de professores.
              </p>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {materialCategories.map((item) => {
                  const active = item.id === categoria;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategoria(item.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-950"
                      }`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {ferramentasFiltradas.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selecionarFerramenta(item.id)}
                  className="group relative min-h-[148px] rounded-[1.6rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-950 hover:shadow-xl"
                >
                  {item.popular ? (
                    <span className="absolute left-3 top-3 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">
                      Popular
                    </span>
                  ) : null}
                  <div className="mt-6 text-3xl">{item.icon}</div>
                  <h3 className="mt-3 text-sm font-black leading-tight text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="rounded-2xl px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-700 transition hover:bg-slate-950 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[0.92fr_1.08fr]">
              <form
                onSubmit={gerarMaterial}
                className="overflow-y-auto border-r border-slate-100 p-5"
              >
                <div
                  className={`mb-4 inline-flex rounded-2xl bg-gradient-to-r ${mode.accent} px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white`}
                >
                  {mode.icon} {mode.title}
                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  {mode.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {mode.description}
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      {mode.primaryFieldLabel}
                    </span>
                    <input
                      value={tema}
                      onChange={(event) => setTema(event.target.value)}
                      placeholder="Digite ou escolha um assunto..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      Disciplina
                    </span>
                    <input
                      value={componente}
                      onChange={(event) => setComponente(event.target.value)}
                      placeholder="Ex.: Língua Portuguesa"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                    />
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      Ano escolar
                    </span>
                    <input
                      value={anoSerie}
                      onChange={(event) => setAnoSerie(event.target.value)}
                      placeholder="Ex.: [EM] 2ª série"
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
                      <option>Educação Infantil</option>
                      <option>Ensino Fundamental</option>
                      <option>Ensino Médio</option>
                      <option>EJA</option>
                    </select>
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
                      <option value="facil">Fácil</option>
                      <option value="media">Média</option>
                      <option value="avancada">Avançada</option>
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
                        Quantidade
                      </span>
                      <input
                        value={quantidade}
                        onChange={(event) => setQuantidade(event.target.value)}
                        placeholder="Ex.: 10 questões, 12 slides..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                      />
                    </label>
                  )}

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-black text-slate-700">
                      Observações opcionais
                    </span>
                    <textarea
                      value={objetivo}
                      onChange={(event) => setObjetivo(event.target.value)}
                      placeholder="Ex.: linguagem simples, foco em revisão, incluir exemplos do cotidiano..."
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(sugestoesTema[tipo] || []).map((item) => (
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
                      onChange={(event) =>
                        setIncluirGabarito(event.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    Incluir gabarito/solução
                  </label>

                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
                  >
                    Limpar
                  </button>
                </div>

                {erro ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {erro}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Gerando..." : `Criar ${mode.shortTitle}`}
                </button>
              </form>

              <section className="min-h-0 overflow-y-auto bg-slate-50 p-5">
                {loading ? (
                  <div className="flex h-full min-h-[420px] items-center justify-center">
                    <div className="w-full max-w-md rounded-[2rem] border border-white bg-white p-6 text-center shadow-xl">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-white">
                        {mode.icon}
                      </div>
                      <h3 className="mt-5 text-2xl font-black text-slate-950">
                        {mode.loadingTitle}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                        {mode.loadingDescription}
                      </p>
                      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" />
                      </div>
                    </div>
                  </div>
                ) : resultadoHtml ? (
                  <div>
                    <div className="mb-4 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={abrirNoEditor}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
                      >
                        Abrir no Editor
                      </button>
                      <button
                        type="button"
                        onClick={baixarWord}
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5"
                      >
                        Baixar .doc
                      </button>
                    </div>
                    <article
                      className="prose prose-slate max-w-none rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                      dangerouslySetInnerHTML={{ __html: resultadoHtml }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center">
                    <div className="max-w-md text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-sm">
                        {mode.icon}
                      </div>
                      <h3 className="mt-5 text-2xl font-black text-slate-950">
                        Pronto para criar
                      </h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        Preencha disciplina, ano escolar e assunto. O resultado
                        aparece aqui e pode ir direto para o Editor.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function MateriaisPage() {
  return (
    <PremiumAccessGate featureName="o Gerador IA de Materiais">
      <MateriaisStudio />
    </PremiumAccessGate>
  );
}
