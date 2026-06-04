"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import {
  DEFAULT_MATERIAL_EDUCATION,
  EDUCATION_STAGES,
  educationDefaultsForTool,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  normalizeMaterialEducation,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";
import { toolSupportsGabarito } from "@/lib/educacao/material-form-config";
import {
  defaultQuantityForTool,
  getQuantityPresets,
} from "@/lib/educacao/material-quantity-presets";
import {
  getPlanifyTool,
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";

const SELECT_FIELD_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white";

type Dificuldade = "facil" | "media" | "avancada";
type FormatoJogo =
  | "caca-palavras"
  | "cruzadinha"
  | "quiz"
  | "bingo"
  | "trilha"
  | "memoria"
  | "domino"
  | "cartas";

type MaterialHistoryItem = {
  id: string;
  titulo: string;
  tipo: PlanifyToolId;
  tema: string;
  componente: string;
  anoSerie: string;
  html: string;
  createdAt: string;
};

const HISTORY_KEY = "planify-historico-materiais";

const formatoJogos: { id: FormatoJogo; label: string }[] = [
  { id: "caca-palavras", label: "Caça-palavras" },
  { id: "cruzadinha", label: "Cruzadinha" },
  { id: "quiz", label: "Quiz" },
  { id: "bingo", label: "Bingo" },
  { id: "trilha", label: "Trilha pedagógica" },
  { id: "memoria", label: "Memória" },
  { id: "domino", label: "Dominó" },
  { id: "cartas", label: "Cartas" },
];

type ConteudoSugerido = {
  id: string;
  titulo: string;
  descricao: string;
  objetivos: string[];
};

const sugestoesTema: Record<PlanifyToolId, string[]> = {
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
  redacao: [
    "Desafios da mobilidade urbana",
    "Tecnologia na educação",
    "Cidadania digital e democracia",
  ],
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

  if (typeof record.html === "string" && record.html.trim()) {
    return record.html;
  }

  const aiPayload =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;

  if (aiPayload) {
    for (const field of ["printHtml", "visualHtml", "html"]) {
      const value = aiPayload[field];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  const possibleFields = [
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

function buildTitle(mode: PlanifyToolId, tema: string): string {
  const config = getPlanifyTool(mode);
  return `${config.shortTitle} — ${tema || "Material Planify"}`;
}

function loadHistory(): MaterialHistoryItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as unknown;
    return Array.isArray(raw) ? (raw as MaterialHistoryItem[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

type MateriaisClientProps = {
  /** Modo embutido no dashboard: só o painel da ferramenta, sem catálogo */
  studioMode?: boolean;
  initialTipo?: PlanifyToolId;
  initialTema?: string;
  onStudioClose?: () => void;
};

export function MateriaisClient({
  studioMode = false,
  initialTipo,
  initialTema = "",
  onStudioClose,
}: MateriaisClientProps = {}) {
  const [categoria, setCategoria] = useState<ToolCategoryId>("todos");
  const [tipo, setTipo] = useState<PlanifyToolId>(initialTipo ?? "slides");
  const [modalAberto, setModalAberto] = useState(studioMode);
  const [tema, setTema] = useState(initialTema);
  const [etapa, setEtapa] = useState(DEFAULT_MATERIAL_EDUCATION.etapa);
  const [anoSerie, setAnoSerie] = useState(DEFAULT_MATERIAL_EDUCATION.anoSerie);
  const [areaConhecimento, setAreaConhecimento] = useState(
    DEFAULT_MATERIAL_EDUCATION.areaConhecimento,
  );
  const [componente, setComponente] = useState(
    DEFAULT_MATERIAL_EDUCATION.componente,
  );
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [alertasGeracao, setAlertasGeracao] = useState<string[]>([]);
  const [pipelineGeracao, setPipelineGeracao] = useState<string | null>(null);
  const [conteudosSugeridos, setConteudosSugeridos] = useState<
    ConteudoSugerido[] | null
  >(null);
  const [sugerindoConteudos, setSugerindoConteudos] = useState(false);
  const [quantidade, setQuantidade] = useState(
    defaultQuantityForTool(initialTipo ?? "slides"),
  );
  const [dificuldade, setDificuldade] = useState<Dificuldade>("media");
  const [formatoJogo, setFormatoJogo] = useState<FormatoJogo>("caca-palavras");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [resultadoHtml, setResultadoHtml] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [historico, setHistorico] = useState<MaterialHistoryItem[]>([]);

  useEffect(() => {
    if (studioMode && initialTipo) {
      setTipo(initialTipo);
      setModalAberto(true);
      setHistorico(loadHistory());
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tipoUrl = params.get("tipo");
    const categoriaUrl = params.get("categoria");

    if (planifyTools.some((tool) => tool.id === tipoUrl)) {
      setTipo(tipoUrl as PlanifyToolId);
      setModalAberto(true);
    }

    if (toolCategories.some((category) => category.id === categoriaUrl)) {
      setCategoria(categoriaUrl as ToolCategoryId);
    }

    setHistorico(loadHistory());
  }, [studioMode, initialTipo]);

  useEffect(() => {
    if (!studioMode || !initialTipo) return;
    setTipo(initialTipo);
    setResultadoHtml("");
    setErro("");
    setModalAberto(true);
  }, [studioMode, initialTipo]);

  useEffect(() => {
    if (initialTema.trim()) setTema(initialTema.trim());
  }, [initialTema]);

  useEffect(() => {
    if (!studioMode) return;

    function onObjetivoHint(event: Event) {
      const snippet = (event as CustomEvent<string>).detail;
      if (!snippet || typeof snippet !== "string") return;
      setObjetivo((prev) =>
        prev.trim() ? `${prev.trim()}\n${snippet}` : snippet,
      );
    }

    window.addEventListener("planify-objetivo-hint", onObjetivoHint);

    try {
      const stored = sessionStorage.getItem("planify-studio-objetivo-hint");
      if (stored) {
        sessionStorage.removeItem("planify-studio-objetivo-hint");
        setObjetivo((prev) =>
          prev.trim() ? `${prev.trim()}\n${stored}` : stored,
        );
      }
    } catch {
      /* ignore */
    }

    return () =>
      window.removeEventListener("planify-objetivo-hint", onObjetivoHint);
  }, [studioMode]);

  const mode = useMemo(() => getPlanifyTool(tipo), [tipo]);
  const isJogo = tipo === "jogo";
  const isRedacao = tipo === "redacao";
  const showGabarito = toolSupportsGabarito(tipo);

  const yearOptions = useMemo(() => getYearOptions(etapa), [etapa]);
  const areaOptions = useMemo(() => getAreaOptions(etapa), [etapa]);
  const componentOptions = useMemo(
    () => getComponentOptions(etapa, areaConhecimento),
    [etapa, areaConhecimento],
  );
  const quantityPresets = useMemo(() => getQuantityPresets(tipo), [tipo]);

  function currentEducation(): MaterialEducationFields {
    return { etapa, anoSerie, areaConhecimento, componente };
  }

  function applyEducation(patch: Partial<MaterialEducationFields>) {
    const normalized = normalizeMaterialEducation(currentEducation(), patch);
    setEtapa(normalized.etapa);
    setAnoSerie(normalized.anoSerie);
    setAreaConhecimento(normalized.areaConhecimento);
    setComponente(normalized.componente);
  }

  useEffect(() => {
    setQuantidade(defaultQuantityForTool(tipo));
    applyEducation(educationDefaultsForTool(tipo, currentEducation()));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar ferramenta
  }, [tipo]);

  const objetivoPlaceholder =
    "Ex.: desenvolver argumentação, revisar conceitos-chave, trabalhar leitura crítica...";

  const observacoesPlaceholder = isRedacao
    ? "Ex.: dissertação argumentativa, 25–30 linhas, foco em proposta de intervenção..."
    : "Ex.: linguagem simples, tempo de aula de 50 min, turma com dificuldade em leitura...";

  const gabaritoLabel = isRedacao
    ? "Incluir critérios de avaliação e redação modelo"
    : "Incluir gabarito/solução";

  const ferramentasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();

    return planifyTools.filter((item) => {
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

  function selecionarFerramenta(novoTipo: PlanifyToolId) {
    setTipo(novoTipo);
    setResultadoHtml("");
    setErro("");
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setModalAberto(true);
  }

  async function sugerirConteudosComIA() {
    if (!tema.trim()) {
      setErro("Informe o tema antes de pedir sugestões de conteúdo.");
      return;
    }

    if (!componente.trim() || !anoSerie.trim()) {
      setErro("Informe disciplina e ano/série para sugerir conteúdos.");
      return;
    }

    setSugerindoConteudos(true);
    setErro("");

    try {
      const response = await fetch("/api/ai/material/sugerir-conteudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapa,
          anoSerie,
          areaConhecimento,
          componenteCurricular: componente,
          tema,
          tipo,
          modeloJogo: isJogo ? formatoJogo.replace(/-/g, "_") : undefined,
          quantidade,
          observacoes: observacoes.trim() || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: {
          conteudos?: ConteudoSugerido[];
          alertas?: string[];
        };
        error?: { message?: string };
      };

      if (!response.ok || !data?.success || !data.data?.conteudos?.length) {
        throw new Error(
          data?.error?.message || "Não foi possível sugerir conteúdos agora.",
        );
      }

      setConteudosSugeridos(data.data.conteudos);
      if (data.data.alertas?.length) {
        setAlertasGeracao(data.data.alertas);
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao sugerir conteúdos com IA.",
      );
    } finally {
      setSugerindoConteudos(false);
    }
  }

  function aplicarConteudoSugerido(item: ConteudoSugerido) {
    setTema(item.titulo);
    if (item.objetivos?.length) {
      setObjetivo(item.objetivos.join("\n"));
    }
    setObservacoes((prev) =>
      prev.trim()
        ? prev
        : item.descricao,
    );
  }

  function limparFormulario() {
    setTema("");
    applyEducation(educationDefaultsForTool(tipo, DEFAULT_MATERIAL_EDUCATION));
    setObjetivo("");
    setObservacoes("");
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setConteudosSugeridos(null);
    setQuantidade(defaultQuantityForTool(tipo));
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

    setHistorico(loadHistory());
  }

  function limparHistorico() {
    const keys = [
      "planify-historico-materiais",
      "planify_historico_materiais",
      "planifyHistoricoMateriais",
    ];
    keys.forEach((key) => localStorage.removeItem(key));
    setHistorico([]);
  }

  function reabrirHistorico(item: MaterialHistoryItem) {
    setTipo(item.tipo);
    setTema(item.tema);
    setComponente(item.componente);
    setAnoSerie(item.anoSerie);
    setResultadoHtml(item.html);
    setErro("");
    setModalAberto(true);
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

  async function executarGeracao() {
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
    setAlertasGeracao([]);
    setPipelineGeracao(null);

    try {
      const objetivoComposto = [
        areaConhecimento ? `Área: ${areaConhecimento}` : "",
        objetivo.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      const payload = {
        tipoMaterial: tipo,
        tipo,
        etapa,
        anoSerie,
        componenteCurricular: componente,
        componente,
        tema,
        temaCentral: tema,
        objetivo: objetivoComposto,
        objetivos: objetivoComposto,
        observacoes: observacoes.trim() || undefined,
        quantidade,
        dificuldade,
        formatoJogo: isJogo ? formatoJogo : null,
        incluirGabarito: showGabarito && incluirGabarito,
        areaConhecimento,
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

      if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const alertas = Array.isArray(record.alertas)
          ? record.alertas.map((item) => String(item)).filter(Boolean)
          : [];
        if (alertas.length) setAlertasGeracao(alertas);

        if (typeof record.pipeline === "string") {
          const labels: Record<string, string> = {
            ai: "Motor pedagógico completo",
            engine: "Motor visual dedicado",
            "engine-fallback": "Motor auxiliar (fallback)",
          };
          setPipelineGeracao(labels[record.pipeline] ?? record.pipeline);
        }
      }

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

  function gerarMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executarGeracao();
  }

  function fecharPainel() {
    if (studioMode && onStudioClose) {
      onStudioClose();
      return;
    }
    setModalAberto(false);
  }

  const painelCriacao = modalAberto ? (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-indigo-100/80 bg-white shadow-[0_8px_40px_-16px_rgba(99,102,241,0.2)] ${
        studioMode ? "rounded-none border-0 shadow-none" : ""
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${mode.accent} text-white`}
          >
            <PlanifyIcon name={mode.icon} className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black leading-none text-slate-950">
              {mode.title}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {mode.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fecharPainel}
          aria-label={studioMode ? "Voltar ao início" : "Voltar ao catálogo"}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-600 transition hover:border-indigo-300 hover:text-slate-950"
        >
          <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
          <span className="hidden sm:inline">
            {studioMode ? "Início" : "Catálogo"}
          </span>
        </button>
      </div>

      <div
        className={`grid min-h-0 flex-1 lg:grid-cols-[0.9fr_1.1fr] ${
          studioMode ? "min-h-0" : "min-h-[600px] lg:min-h-[680px]"
        }`}
      >
        <form
          onSubmit={gerarMaterial}
          className="min-h-0 overflow-y-auto overscroll-contain border-r border-slate-100 p-5"
        >
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            {mode.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {mode.description}
          </p>

          {isRedacao ? (
            <p className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold leading-6 text-indigo-900">
              Gera a proposta completa (tema, textos motivadores, comando e critérios)
              para a turma produzir a redação — não corrige textos já escritos pelos
              alunos.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">
                Etapa de ensino
              </span>
              <select
                value={etapa}
                onChange={(event) =>
                  applyEducation({ etapa: event.target.value })
                }
                className={SELECT_FIELD_CLASS}
              >
                {EDUCATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">
                Ano / série
              </span>
              <select
                value={anoSerie}
                onChange={(event) =>
                  applyEducation({ anoSerie: event.target.value })
                }
                className={SELECT_FIELD_CLASS}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Área do conhecimento
              </span>
              <select
                value={areaConhecimento}
                onChange={(event) =>
                  applyEducation({ areaConhecimento: event.target.value })
                }
                className={SELECT_FIELD_CLASS}
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Disciplina / componente
              </span>
              <select
                value={componente}
                onChange={(event) =>
                  applyEducation({ componente: event.target.value })
                }
                className={SELECT_FIELD_CLASS}
              >
                {componentOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-black text-slate-700">
                  {mode.primaryFieldLabel}
                </span>
                <button
                  type="button"
                  onClick={() => void sugerirConteudosComIA()}
                  disabled={sugerindoConteudos || loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                  {sugerindoConteudos ? "Sugerindo..." : "Sugerir conteúdos"}
                </button>
              </span>
              <input
                value={tema}
                onChange={(event) => setTema(event.target.value)}
                placeholder="Digite ou escolha um assunto abaixo..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
              />
            </label>

            {conteudosSugeridos && conteudosSugeridos.length > 0 ? (
              <div className="md:col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-indigo-800">
                  Sugestões de conteúdo (IA)
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conteudosSugeridos.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => aplicarConteudoSugerido(item)}
                      className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-900"
                      title={item.descricao}
                    >
                      {item.titulo}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Objetivo pedagógico (opcional)
              </span>
              <textarea
                value={objetivo}
                onChange={(event) => setObjetivo(event.target.value)}
                placeholder={objetivoPlaceholder}
                rows={2}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
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
                className={SELECT_FIELD_CLASS}
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
                  className={SELECT_FIELD_CLASS}
                >
                  {formatoJogos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">
                  {isRedacao ? "Estrutura da proposta" : "Quantidade"}
                </span>
                <select
                  value={quantidade}
                  onChange={(event) => setQuantidade(event.target.value)}
                  className={SELECT_FIELD_CLASS}
                >
                  {quantityPresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-black text-slate-700">
                Observações opcionais
              </span>
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder={observacoesPlaceholder}
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:bg-white"
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
            {showGabarito ? (
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={incluirGabarito}
                  onChange={(event) =>
                    setIncluirGabarito(event.target.checked)
                  }
                  className="h-4 w-4 accent-slate-950"
                />
                {gabaritoLabel}
              </label>
            ) : (
              <span className="text-sm font-semibold text-slate-500">
                Gabarito não se aplica a esta ferramenta.
              </span>
            )}

            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Limpar
            </button>
          </div>

          {erro ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              <PlanifyIcon name="alertCircle" className="mt-0.5 h-4 w-4 shrink-0" />
              {erro}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 px-6 py-4 text-sm font-black text-white shadow-[0_8px_24px_-10px_rgba(99,102,241,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              "Gerando..."
            ) : (
              <>
                <PlanifyIcon name="spark" className="h-4 w-4" />
                Criar {mode.shortTitle}
              </>
            )}
          </button>
        </form>

        <section className="min-h-0 overflow-y-auto overscroll-contain bg-slate-50 p-5">
          {loading ? (
            <div className="flex h-full min-h-[280px] items-center justify-center p-4">
              <PlanifyOwlGenerationCoach
                active
                title={mode.loadingTitle}
                description={mode.loadingDescription}
                context="material"
                toolId={tipo}
                className="max-w-lg"
              />
            </div>
          ) : resultadoHtml ? (
            <div>
              {(pipelineGeracao || alertasGeracao.length > 0) && (
                <div className="mb-4 space-y-3">
                  {pipelineGeracao ? (
                    <p className="text-xs font-bold text-slate-500">
                      Entrega:{" "}
                      <span className="font-black text-indigo-700">
                        {pipelineGeracao}
                      </span>
                    </p>
                  ) : null}
                  {alertasGeracao.length > 0 ? (
                    <aside className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-black">Avisos do Planify</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold">
                        {alertasGeracao.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </aside>
                  ) : null}
                </div>
              )}
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void executarGeracao()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                  Regenerar
                </button>
                <button
                  type="button"
                  onClick={abrirNoEditor}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
                >
                  <PlanifyIcon name="editor" className="h-4 w-4" />
                  Abrir no Editor
                </button>
                <button
                  type="button"
                  onClick={baixarWord}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  <PlanifyIcon name="download" className="h-4 w-4" />
                  Baixar .doc
                </button>
              </div>
              <article
                className="rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-800 shadow-sm [&_h1]:text-3xl [&_h1]:font-black [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mt-4 [&_h3]:font-black [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: resultadoHtml }}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
                  <PlanifyIcon name={mode.icon} className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Pronto para criar
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Preencha disciplina, ano escolar e assunto. O resultado aparece
                  aqui e pode ir direto para o Editor.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  ) : null;

  if (studioMode) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        {painelCriacao}
      </div>
    );
  }

  return (
    <PlanifyWorkspacePane>
    <div>
      {/* Catálogo (visível quando painel fechado) */}
      {!modalAberto ? (
        <>
        {/* Catálogo + busca + categorias */}
        <section className="pl-section-hero overflow-hidden rounded-[1.85rem] border border-fuchsia-100/70 p-5 shadow-[0_8px_32px_-16px_rgba(236,72,153,0.12)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <span className="pl-badge-indigo">
                <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                Criar com IA
              </span>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-violet-950 sm:text-3xl">
                Escolha uma ferramenta e gere o material em segundos.
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-violet-500/90">
                Catálogo organizado por categoria. Clique na ferramenta para abrir o painel de criação com IA.
              </p>
            </div>

            <div className="relative">
              <PlanifyIcon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fuchsia-300"
              />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar ferramenta..."
                aria-label="Buscar ferramenta"
                className="w-full rounded-2xl border border-rose-100/90 bg-white/95 py-4 pl-12 pr-4 text-sm font-semibold text-violet-950 outline-none transition focus:border-fuchsia-300 focus:bg-white focus:ring-4 focus:ring-fuchsia-100/80"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {toolCategories.map((item) => {
              const active = item.id === categoria;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategoria(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                    active
                      ? "border-fuchsia-200 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-400 text-white shadow-[0_4px_14px_-4px_rgba(192,38,211,0.45)]"
                      : "border-violet-100 bg-white text-violet-600 hover:border-fuchsia-200 hover:text-violet-950"
                  }`}
                >
                  <PlanifyIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Cards de ferramentas */}
        {ferramentasFiltradas.length > 0 ? (
          <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {ferramentasFiltradas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selecionarFerramenta(item.id)}
                className="group relative min-h-[156px] rounded-[1.5rem] border border-violet-50/90 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-fuchsia-200 hover:shadow-[0_16px_36px_-14px_rgba(167,139,250,0.35)]"
              >
                {item.popular ? (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                    Top
                  </span>
                ) : null}
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-sm transition group-hover:scale-110`}>
                  <PlanifyIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-black leading-tight text-violet-950">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-violet-400">
                  {item.description}
                </p>
              </button>
            ))}
          </section>
        ) : (
          <section className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-600">
              Nenhuma ferramenta encontrada para essa busca ou categoria.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoria("todos");
              }}
              className="mt-3 inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
            >
              Limpar filtros
            </button>
          </section>
        )}

        {/* Materiais recentes (histórico) */}
        {historico.length > 0 ? (
          <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Materiais recentes
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  Reabra um material gerado recentemente neste dispositivo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/historico"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-slate-950"
                >
                  Ver histórico
                </Link>
                <button
                  type="button"
                  onClick={limparHistorico}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {historico.slice(0, 6).map((item) => {
                const itemTool = getPlanifyTool(item.tipo);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => reabrirHistorico(item)}
                    className="group flex items-start gap-3 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-950 hover:bg-white hover:shadow-lg"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white">
                      <PlanifyIcon name={itemTool.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">
                        {item.tema || itemTool.shortTitle}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                        {itemTool.shortTitle}
                        {item.componente ? ` â€¢ ${item.componente}` : ""}
                        {item.createdAt ? ` â€¢ ${formatDate(item.createdAt)}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
        </>
      ) : null}

      {painelCriacao}
    </div>
    </PlanifyWorkspacePane>
  );
}

export default MateriaisClient;
