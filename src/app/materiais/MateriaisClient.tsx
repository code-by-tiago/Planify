"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { useAutoGoogleExport } from "@/hooks/useAutoGoogleExport";
import { MaterialGenerationSummaryPanel } from "@/components/materiais/MaterialGenerationSummary";
import { MaterialQualityScoreBar } from "@/components/materiais/MaterialQualityScoreBar";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import {
  buildElevatePayload,
  requestMaterialGeneration,
} from "@/lib/materiais/elevate-material-client";
import { isMaterialStreamType } from "@/lib/materiais/material-stream-types";
import { requestMaterialGenerationStream } from "@/lib/materiais/material-stream-client";
import { requestExamQuestionsRetry } from "@/lib/materiais/material-exam-retry-client";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import {
  HUD_FIELD_CLASS,
  HUD_FILTER_CHIP_ACTIVE,
  HUD_FILTER_CHIP_INACTIVE,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";
import {
  DEFAULT_MATERIAL_EDUCATION,
  educationDefaultsForTool,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";
import { useBnccEducationOptions } from "@/hooks/useBnccEducationOptions";
import { toolSupportsGabarito, getMaterialFormFieldConfig, resolveMaterialDisplayTema } from "@/lib/educacao/material-form-config";
import {
  defaultQuantityForTool,
  getQuantityPresets,
} from "@/lib/educacao/material-quantity-presets";
import {
  clearMaterialHistory,
  loadMaterialHistoryPreview,
  loadMaterialMetaFromHistoryId,
  openMaterialInEditor,
  persistGeneratedMaterial,
  readAutoOpenEditorPreference,
  writeAutoOpenEditorPreference,
  type MaterialEditorMeta,
  type MaterialHistoryPreview,
} from "@/lib/materiais/material-editor-flow";
import { buildMaterialGenerationSummary } from "@/lib/materiais/material-generation-summary";
import {
  resolveGoogleProductForTool,
  saveAutoGoogleExportIntent,
} from "@/lib/google/google-auto-export";
import {
  activePlanifyTools,
  getPlanifyTool,
  isActivePlanifyToolId,
  planifyToolCount,
  planifyTools,
  toolCategories,
  type PlanifyToolId,
  type ToolCategoryId,
} from "@/lib/pro/planifyTools";
import { getClientCreditCost } from "@/lib/credits/credit-costs";
import {
  dispatchCreditsChangedIfNeeded,
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
} from "@/lib/pro/generation-error-ui";
import { readProvaInjectObservacoes } from "@/lib/banco-questoes/question-bank-storage";
import { resolveUnifiedPipelineLabel } from "@/lib/materiais/unified-pipeline-labels";
import {
  buildPedagogicalObservacoes,
  fetchPedagogicalContext,
  type PedagogicalContextEntry,
} from "@/lib/pedagogical-cache/pedagogical-context-client";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import { PlanifyMaterialHubCard } from "@/components/materials/PlanifyMaterialHubCard";

const SELECT_FIELD_CLASS = HUD_FIELD_CLASS;
const PATIENCE_THRESHOLD_MS = 60_000;
const BancoQuestoesClient = dynamic(
  () =>
    import("@/app/banco-questoes/BancoQuestoesClient").then(
      (module) => module.BancoQuestoesClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-50/60 px-4 py-5 text-sm font-semibold text-cyan-900">
        Carregando o banco de questões…
      </div>
    ),
  },
);
const LONG_GENERATION_TYPES = new Set([
  "prova",
  "lista",
  "apostila",
  "plano-aula",
  "sequencia",
  "projeto",
  "redacao",
]);

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

function buildTitle(mode: PlanifyToolId, tema: string, conteudo = ""): string {
  const config = getPlanifyTool(mode);
  const label = resolveMaterialDisplayTema(tema, conteudo) || "Material Planify";
  return `${config.shortTitle} — ${label}`;
}

function queueAutoGoogleExportForMaterial(params: {
  toolId: PlanifyToolId;
  title: string;
  returnTo: string;
}): void {
  const product = resolveGoogleProductForTool(params.toolId);
  if (!product) return;

  saveAutoGoogleExportIntent({
    product,
    title: params.title,
    returnTo: params.returnTo,
  });
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
  onOpenRelatedTool?: (toolId: PlanifyToolId) => void;
};

export function MateriaisClient({
  studioMode = false,
  initialTipo,
  initialTema = "",
  onStudioClose,
  onOpenRelatedTool,
}: MateriaisClientProps = {}) {
  const school = useSchoolClasses();
  const [categoria, setCategoria] = useState<ToolCategoryId>("todos");
  const [tipo, setTipo] = useState<PlanifyToolId>(initialTipo ?? "atividade");
  const [modalAberto, setModalAberto] = useState(studioMode);
  const [conteudo, setConteudo] = useState(initialTema);
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
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [lastGenerationPayload, setLastGenerationPayload] =
    useState<MaterialEngineInput | null>(null);
  const [elevatingQuality, setElevatingQuality] = useState(false);
  const [retryingExam, setRetryingExam] = useState(false);
  const [quantidade, setQuantidade] = useState(
    defaultQuantityForTool(initialTipo ?? "atividade"),
  );
  const [dificuldade, setDificuldade] = useState<Dificuldade>("media");
  const [formatoJogo, setFormatoJogo] = useState<FormatoJogo>("caca-palavras");
  const [examCreationSource, setExamCreationSource] = useState<"ia" | "banco">("ia");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [resultadoHtml, setResultadoHtml] = useState("");
  const [resultadoEstrutura, setResultadoEstrutura] =
    useState<MaterialEngineResponse | null>(null);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [realGenerationProgress, setRealGenerationProgress] = useState<
    number | undefined
  >(undefined);
  const [showPatienceMessage, setShowPatienceMessage] = useState(false);
  const patienceTimerRef = useRef<number | null>(null);
  const { runWithRetry, retrying: retryingGeneration } = useRetryableAction();
  const [busca, setBusca] = useState("");
  const [historico, setHistorico] = useState<MaterialHistoryPreview[]>([]);
  const [abrirEditorAutomatico, setAbrirEditorAutomatico] = useState(true);
  const [materialSalvo, setMaterialSalvo] = useState(false);
  const [hintFeedback, setHintFeedback] = useState("");
  const [pedagogicalEntries, setPedagogicalEntries] = useState<
    PedagogicalContextEntry[]
  >([]);
  const pedagogicalDebounceRef = useRef<number | null>(null);

  useAutoGoogleExport({
    title: buildTitle(tipo, "", conteudo),
    getHtml: () => resultadoHtml,
    returnTo:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}` || "/dashboard"
        : "/dashboard",
    onStatus: setHintFeedback,
  });

  useEffect(() => {
    if (studioMode && initialTipo) {
      setTipo(initialTipo);
      setModalAberto(true);
      setHistorico(loadMaterialHistoryPreview());
      setAbrirEditorAutomatico(readAutoOpenEditorPreference());
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tipoUrl = params.get("tipo");
    const categoriaUrl = params.get("categoria");

    if (tipoUrl && tipoUrl !== "slides" && isActivePlanifyToolId(tipoUrl)) {
      setTipo(tipoUrl as PlanifyToolId);
      setModalAberto(true);
    }

    if (toolCategories.some((category) => category.id === categoriaUrl)) {
      setCategoria(categoriaUrl as ToolCategoryId);
    }

    setHistorico(loadMaterialHistoryPreview());
    setAbrirEditorAutomatico(readAutoOpenEditorPreference());
  }, [studioMode, initialTipo]);

  useEffect(() => {
    if (!studioMode || !initialTipo) return;
    setTipo(initialTipo);
    setResultadoHtml("");
    setErro("");
    setModalAberto(true);
  }, [studioMode, initialTipo]);

  useEffect(() => {
    if (initialTema.trim()) setConteudo(initialTema.trim());
  }, [initialTema]);

  const loadPedagogicalContext = useCallback(async () => {
    const topic = resolveMaterialDisplayTema("", conteudo);
    if (!topic) {
      setPedagogicalEntries([]);
      return;
    }

    try {
      const data = await fetchPedagogicalContext({
        tema: topic,
        componente,
        etapa,
        anoSerie,
      });

      if (data.success && data.kind === "cache_hit" && data.entries.length) {
        setPedagogicalEntries(data.entries);
      } else {
        setPedagogicalEntries([]);
      }
    } catch {
      setPedagogicalEntries([]);
    }
  }, [conteudo, componente, etapa, anoSerie]);

  useEffect(() => {
    if (pedagogicalDebounceRef.current) {
      window.clearTimeout(pedagogicalDebounceRef.current);
    }

    pedagogicalDebounceRef.current = window.setTimeout(() => {
      void loadPedagogicalContext();
    }, 600);

    return () => {
      if (pedagogicalDebounceRef.current) {
        window.clearTimeout(pedagogicalDebounceRef.current);
      }
    };
  }, [loadPedagogicalContext]);

  useEffect(() => {
    if (tipo !== "prova" && tipo !== "lista") return;
    const injected = readProvaInjectObservacoes();
    if (!injected) return;
    setObservacoes((prev) => (prev.trim() ? `${prev.trim()}\n\n${injected}` : injected));
    setHintFeedback("Questões do banco importadas — revise e clique em Criar.");
  }, [tipo]);

  const mode = useMemo(() => getPlanifyTool(tipo), [tipo]);
  const formFields = useMemo(() => getMaterialFormFieldConfig(tipo), [tipo]);
  const displayTema = useMemo(
    () => resolveMaterialDisplayTema("", conteudo),
    [conteudo],
  );
  const generationSummary = useMemo(
    () =>
      resultadoHtml
        ? buildMaterialGenerationSummary({
            tipo,
            html: resultadoHtml,
            estrutura: resultadoEstrutura,
            incluirGabarito,
          })
        : null,
    [
      resultadoHtml,
      resultadoEstrutura,
      tipo,
      incluirGabarito,
    ],
  );
  const isJogo = tipo === "jogo";
  const isRedacao = tipo === "redacao";
  const isPlanoAula = tipo === "plano-aula";
  const isExamTool = tipo === "lista" || tipo === "prova";
  const showGabarito = toolSupportsGabarito(tipo);

  const canRetryExamQuestions = useMemo(() => {
    if (tipo !== "prova" && tipo !== "lista") return false;
    if (!resultadoEstrutura?.exam?.questions?.length) return false;
    return qualityIssues.some(
      (issue) =>
        /^Questão \d+/i.test(issue) ||
        /enunciado|alternativas|gabarito|Prova\/lista/i.test(issue),
    );
  }, [tipo, resultadoEstrutura, qualityIssues]);

  const educationFields = useMemo(
    () => ({ etapa, anoSerie, areaConhecimento, componente }),
    [etapa, anoSerie, areaConhecimento, componente],
  );

  const {
    stageOptions,
    yearOptions,
    areaOptions,
    componentOptions,
    applyEducation,
  } = useBnccEducationOptions(educationFields, (next) => {
    setEtapa(next.etapa);
    setAnoSerie(next.anoSerie);
    setAreaConhecimento(next.areaConhecimento);
    setComponente(next.componente);
  });

  const quantityPresets = useMemo(() => getQuantityPresets(tipo), [tipo]);

  useEffect(() => {
    setQuantidade(defaultQuantityForTool(tipo));
    if (tipo !== "prova" && tipo !== "lista") {
      setExamCreationSource("ia");
    }
    applyEducation(
      educationDefaultsForTool(tipo, {
        etapa,
        anoSerie,
        areaConhecimento,
        componente,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar ferramenta
  }, [tipo]);

  const objetivoPlaceholder =
    "Descreva o objetivo pedagógico, se desejar.";

  const observacoesPlaceholder = isRedacao
    ? "Critérios, formato ou orientações adicionais para a proposta."
    : "Orientações adicionais para a geração, se desejar.";

  const gabaritoLabel = isRedacao
    ? "Incluir critérios de avaliação e redação modelo"
    : "Incluir gabarito/solução";

  const ferramentasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();

    return activePlanifyTools.filter((item) => {
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
    setResultadoEstrutura(null);
    setErro("");
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setModalAberto(true);
  }

  function limparFormulario() {
    setConteudo("");
    applyEducation(educationDefaultsForTool(tipo, DEFAULT_MATERIAL_EDUCATION));
    setObjetivo("");
    setObservacoes("");
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setQualityScore(null);
    setQualityIssues([]);
    setLastGenerationPayload(null);
    setQuantidade(defaultQuantityForTool(tipo));
    setDificuldade("media");
    setFormatoJogo("caca-palavras");
    setIncluirGabarito(true);
    setResultadoHtml("");
    setResultadoEstrutura(null);
    setErro("");
  }

  function buildGenerationPayload(
    overrides: Partial<MaterialEngineInput> = {},
  ): MaterialEngineInput {
    const objetivoComposto = [
      areaConhecimento ? `Área: ${areaConhecimento}` : "",
      objetivo.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const pedagogicalObs =
      pedagogicalEntries.length > 0
        ? buildPedagogicalObservacoes(pedagogicalEntries, observacoes.trim())
        : observacoes.trim() || undefined;

    return {
      tipoMaterial: tipo,
      tipo,
      etapa,
      anoSerie,
      componenteCurricular: componente,
      componente,
      tema: displayTema || undefined,
      temaCentral: displayTema || undefined,
      conteudo,
      objetivo: objetivoComposto,
      objetivos: objetivoComposto,
      observacoes: pedagogicalObs,
      quantidade,
      dificuldade,
      formatoJogo: isJogo ? formatoJogo : null,
      incluirGabarito: showGabarito && incluirGabarito,
      areaConhecimento,
      ...school.turmaPayload,
      discipline: componente.trim() || undefined,
      disciplina: componente.trim() || undefined,
      ...overrides,
    };
  }

  function buildMaterialMeta(
    pipeline?: string | null,
    estrutura?: MaterialEngineResponse | null,
    extras?: Partial<MaterialEditorMeta>,
  ): MaterialEditorMeta {
    const resolvedEstrutura = estrutura ?? resultadoEstrutura;
    return {
      toolId: tipo,
      tema: displayTema,
      componente,
      anoSerie,
      etapa,
      areaConhecimento,
      pipeline: pipeline ?? pipelineGeracao,
      slideTheme: resolvedEstrutura?.slideTheme ?? null,
      designSlides: null,
      qualityScore: extras?.qualityScore ?? qualityScore,
      qualityIssues: extras?.qualityIssues ?? qualityIssues,
      generationPayload: extras?.generationPayload ?? lastGenerationPayload,
      serverMaterialId: extras?.serverMaterialId,
      estrutura: resolvedEstrutura ?? null,
    };
  }

  function limparHistorico() {
    clearMaterialHistory();
    setHistorico([]);
  }

  function reabrirHistorico(item: MaterialHistoryPreview) {
    setTipo(item.tipo);
    setConteudo(item.tema);
    setComponente(item.componente);
    setAnoSerie(item.anoSerie);
    setResultadoHtml(item.html);
    setErro("");
    setMaterialSalvo(true);
    setModalAberto(true);
    const payload =
      item.generationPayload ??
      loadMaterialMetaFromHistoryId(item.id)?.generationPayload ??
      null;
    if (payload) {
      setLastGenerationPayload(payload);
    }
  }

  function abrirHistoricoNoEditor(item: MaterialHistoryPreview) {
    const storedMeta = loadMaterialMetaFromHistoryId(item.id);
    openMaterialInEditor(
      item.html,
      item.titulo,
      storedMeta ?? {
        toolId: item.tipo,
        tema: item.tema,
        componente: item.componente,
        anoSerie: item.anoSerie,
        etapa,
        areaConhecimento,
        generationPayload: item.generationPayload ?? null,
      },
      { from: "materiais" },
    );
  }

  function abrirNoEditor() {
    if (!resultadoHtml) {
      setErro("Gere um material antes de abrir no editor.");
      return;
    }

    openMaterialInEditor(
      resultadoHtml,
      buildTitle(tipo, "", conteudo),
      buildMaterialMeta(),
      { from: "materiais" },
    );
  }

  async function executarGeracao(
    overrides: Partial<MaterialEngineInput> = {},
  ) {
    if (loading || retryingGeneration) return;

    setErro("");
    setErroCta(null);
    setErroRetryable(false);

    if (!conteudo.trim()) {
      setErro("Informe o conteúdo para gerar o material.");
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
    setResultadoEstrutura(null);
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setQualityScore(null);
    setQualityIssues([]);
    setMaterialSalvo(false);
    setHintFeedback("");
    setProgressLabel("");
    setRealGenerationProgress(undefined);
    setShowPatienceMessage(false);
    if (patienceTimerRef.current) {
      window.clearTimeout(patienceTimerRef.current);
    }
    if (LONG_GENERATION_TYPES.has(tipo)) {
      patienceTimerRef.current = window.setTimeout(() => {
        setShowPatienceMessage(true);
      }, PATIENCE_THRESHOLD_MS);
    }

    const idempotencyKey = crypto.randomUUID();

    try {
      await runWithRetry(async () => {
      const turma = school.turmaPayload;
      if (turma.className) {
        await school.rememberPersonalClass(turma.className);
      }

      const payload = {
        ...buildGenerationPayload(overrides),
        idempotencyKey,
      };
      setLastGenerationPayload(payload);

      let data: Record<string, unknown>;
      try {
        if (isMaterialStreamType(tipo)) {
          const streamResult = await requestMaterialGenerationStream(payload, {
            onProgress: ({ phase, message, progress, index, total }) => {
              if (typeof progress === "number") {
                // Eventos de heartbeat da mesma etapa não podem fazer a barra
                // voltar após uma revisão/qualidade já concluída.
                setRealGenerationProgress((current) =>
                  Math.max(current ?? 0, progress),
                );
              }
              if (phase === "images" && index != null && total != null) {
                setProgressLabel(`Resolvendo imagens (${index}/${total})…`);
              } else {
                setProgressLabel(message);
              }
            },
          });
          data = streamResult as Record<string, unknown>;
        } else {
          const result = await requestMaterialGeneration(payload);
          data = result as Record<string, unknown>;
        }
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code?: unknown }).code || "")
            : "";
        if (code === "daily_limit_reached") {
          window.dispatchEvent(new Event("planify:credits-changed"));
        }
        throw error;
      }

      const html = extractHtmlFromResponse(data);

      let estruturaGerada: MaterialEngineResponse | null = null;
      if (data && typeof data === "object" && "estrutura" in data) {
        estruturaGerada =
          (data as { estrutura?: MaterialEngineResponse }).estrutura ?? null;
        setResultadoEstrutura(estruturaGerada);
      } else {
        setResultadoEstrutura(null);
      }

      if (!html) {
        throw new Error(
          "A API respondeu, mas não retornou conteúdo em um formato reconhecido."
        );
      }

      // Atualiza o saldo de créditos exibido (a geração pode ter debitado).
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("planify:credits-changed"));
      }

      let pipelineLabel: string | null = null;

      if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const alertas = Array.isArray(record.alertas)
          ? record.alertas.map((item) => String(item)).filter(Boolean)
          : [];
        const persistWarning =
          typeof record.persistWarning === "string"
            ? record.persistWarning.trim()
            : "";
        if (persistWarning && !alertas.includes(persistWarning)) {
          alertas.push(persistWarning);
        }
        if (alertas.length) setAlertasGeracao(alertas);

        if (typeof record.pipeline === "string") {
          pipelineLabel = resolveUnifiedPipelineLabel(record.pipeline);
          setPipelineGeracao(pipelineLabel);
        }

        if (typeof record.qualityScore === "number") {
          setQualityScore(record.qualityScore);
        }
        if (Array.isArray(record.qualityIssues)) {
          setQualityIssues(
            record.qualityIssues.map((item) => String(item)).filter(Boolean),
          );
        }
      }

      const titulo = buildTitle(tipo, "", conteudo);
      const materiaisReturnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}` || "/dashboard"
          : "/dashboard";
      queueAutoGoogleExportForMaterial({
        toolId: tipo,
        title: titulo,
        returnTo: abrirEditorAutomatico ? "/dashboard?secao=editor" : materiaisReturnTo,
      });
      const record =
        data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const scoreValue =
        typeof record.qualityScore === "number" ? record.qualityScore : null;
      const issuesValue = Array.isArray(record.qualityIssues)
        ? record.qualityIssues.map((item) => String(item)).filter(Boolean)
        : [];
      const serverMaterialId =
        typeof record.materialId === "string" && record.materialId.trim()
          ? record.materialId.trim()
          : undefined;
      const meta = buildMaterialMeta(pipelineLabel, estruturaGerada, {
        qualityScore: scoreValue,
        qualityIssues: issuesValue,
        generationPayload: payload,
        serverMaterialId,
      });
      if (abrirEditorAutomatico) {
        openMaterialInEditor(html, titulo, meta, {
          from: "materiais",
        });
        setHistorico(loadMaterialHistoryPreview());
        setMaterialSalvo(true);
        return;
      }

      persistGeneratedMaterial(html, titulo, meta);
      setHistorico(loadMaterialHistoryPreview());
      setMaterialSalvo(true);
      setResultadoHtml(html);
      }, { onError: dispatchCreditsChangedIfNeeded });
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      if (patienceTimerRef.current) {
        window.clearTimeout(patienceTimerRef.current);
        patienceTimerRef.current = null;
      }
      setShowPatienceMessage(false);
      setProgressLabel("");
      setLoading(false);
    }
  }

  async function elevarQualidadeMaterial() {
    if (!lastGenerationPayload) {
      setErro("Gere o material uma vez antes de elevar a qualidade.");
      return;
    }

    setElevatingQuality(true);
    setErro("");

    try {
      const problemas = [...qualityIssues, ...alertasGeracao].filter(Boolean);
      const payload = buildElevatePayload(lastGenerationPayload, problemas);
      const data = await requestMaterialGeneration(payload);
      const html = extractHtmlFromResponse(data);

      if (!html) {
        throw new Error("A regeneração não retornou conteúdo.");
      }

      window.dispatchEvent(new Event("planify:credits-changed"));

      const alertas = Array.isArray(data.alertas)
        ? data.alertas.map((item) => String(item)).filter(Boolean)
        : [];
      const persistWarning =
        typeof data.persistWarning === "string" ? data.persistWarning.trim() : "";
      if (persistWarning && !alertas.includes(persistWarning)) {
        alertas.push(persistWarning);
      }
      setAlertasGeracao(alertas);
      if (typeof data.qualityScore === "number") setQualityScore(data.qualityScore);
      if (Array.isArray(data.qualityIssues)) {
        setQualityIssues(
          data.qualityIssues.map((item) => String(item)).filter(Boolean),
        );
      }
      setLastGenerationPayload(payload);

      const titulo = buildTitle(tipo, "", conteudo);
      const meta = buildMaterialMeta(
        pipelineGeracao,
        (data.estrutura as MaterialEngineResponse | undefined) ?? null,
        {
          qualityScore:
            typeof data.qualityScore === "number" ? data.qualityScore : null,
          qualityIssues: Array.isArray(data.qualityIssues)
            ? data.qualityIssues.map((item) => String(item)).filter(Boolean)
            : [],
          generationPayload: payload,
          serverMaterialId:
            typeof data.materialId === "string" && data.materialId.trim()
              ? data.materialId.trim()
              : undefined,
        },
      );
      persistGeneratedMaterial(html, titulo, meta);
      setResultadoHtml(html);
      setMaterialSalvo(true);
      setHistorico(loadMaterialHistoryPreview());
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setElevatingQuality(false);
    }
  }

  async function regenerarQuestoesFracas() {
    if (!lastGenerationPayload || !resultadoEstrutura) {
      setErro("Gere a prova ou lista antes de corrigir questões.");
      return;
    }

    setRetryingExam(true);
    setErro("");

    try {
      const result = await requestExamQuestionsRetry({
        ...lastGenerationPayload,
        estrutura: resultadoEstrutura,
      });
      window.dispatchEvent(new Event("planify:credits-changed"));
      setResultadoHtml(result.html);
      setResultadoEstrutura(result.estrutura);
      if (typeof result.qualityScore === "number") {
        setQualityScore(result.qualityScore);
      }
      if (result.qualityIssues) {
        setQualityIssues(result.qualityIssues);
      }

      const titulo = buildTitle(tipo, "", conteudo);
      const meta = buildMaterialMeta(pipelineGeracao, result.estrutura, {
        qualityScore: result.qualityScore ?? qualityScore,
        qualityIssues: result.qualityIssues ?? qualityIssues,
        generationPayload: lastGenerationPayload,
      });
      persistGeneratedMaterial(result.html, titulo, meta);
      setMaterialSalvo(true);
      setHistorico(loadMaterialHistoryPreview());
      setHintFeedback(
        result.questionsResolved > 0
          ? `${result.questionsResolved} questão(ões) reescrita(s) — revise antes de exportar.`
          : "Nenhuma questão fraca detectada para correção parcial.",
      );
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setRetryingExam(false);
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
    <MaterialToolPageShell
      tool={mode}
      studioMode={studioMode}
      onBack={fecharPainel}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={Boolean(resultadoHtml)}
      previewLoading={loading}
      form={
        <form onSubmit={gerarMaterial} className="space-y-1 max-lg:pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {studioMode ? (
              <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Configurar geração
              </p>
            ) : (
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                {mode.title}
              </h2>
            )}
            <CreditsBalancePill />
          </div>
          {!studioMode ? (
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {mode.description}
            </p>
          ) : null}

          <div className="mt-4">
            <DailyGenerationsBar tipoMaterial={tipo} />
          </div>

          {isExamTool ? (
            <section className="mt-5 rounded-2xl border border-cyan-400/25 bg-cyan-50/50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-900">
                Como deseja criar esta {tipo === "lista" ? "lista" : "prova"}?
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Escolha gerar questões inéditas com IA ou montar a avaliação com questões já
                revisadas no seu banco.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setExamCreationSource("ia")}
                  className={`rounded-xl border p-4 text-left transition ${
                    examCreationSource === "ia"
                      ? "border-cyan-600 bg-cyan-600 text-white shadow-sm"
                      : "border-cyan-200 bg-white text-slate-800 hover:border-cyan-400"
                  }`}
                >
                  <span className="block text-sm font-black">Gerar com IA</span>
                  <span className={`mt-1 block text-xs font-medium ${
                    examCreationSource === "ia" ? "text-cyan-50" : "text-slate-500"
                  }`}>
                    Crie questões novas a partir do seu tema e objetivos.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExamCreationSource("banco")}
                  className={`rounded-xl border p-4 text-left transition ${
                    examCreationSource === "banco"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                      : "border-emerald-200 bg-white text-slate-800 hover:border-emerald-400"
                  }`}
                >
                  <span className="block text-sm font-black">Usar banco de questões</span>
                  <span className={`mt-1 block text-xs font-medium ${
                    examCreationSource === "banco" ? "text-emerald-50" : "text-slate-500"
                  }`}>
                    Pesquise, selecione e monte com questões do seu acervo.
                  </span>
                </button>
              </div>
            </section>
          ) : null}

          {isExamTool && examCreationSource === "banco" ? (
            <BancoQuestoesClient
              embedded
              targetMaterial={tipo}
              onBack={() => setExamCreationSource("ia")}
            />
          ) : (
            <>
          {isRedacao ? (
            <p className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-50/60 px-4 py-3 text-sm font-semibold leading-6 text-cyan-900">
              Gera a proposta completa (tema, textos motivadores, comando e critérios)
              para a turma produzir a redação — não corrige textos já escritos pelos
              alunos.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className={HUD_SECTION_LABEL}>
                Etapa de ensino
              </span>
              <select
                value={etapa}
                onChange={(event) =>
                  applyEducation({ etapa: event.target.value })
                }
                className={SELECT_FIELD_CLASS}
              >
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className={HUD_SECTION_LABEL}>
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
              <span className={HUD_SECTION_LABEL}>
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
              <span className={HUD_SECTION_LABEL}>
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
          </div>

          <label className="mt-5 block">
            <span className={HUD_SECTION_LABEL}>{formFields.conteudoLabel}</span>
            <textarea
              value={conteudo}
              onChange={(event) => setConteudo(event.target.value)}
              placeholder={formFields.conteudoPlaceholder}
              rows={4}
              className={HUD_TEXTAREA_CLASS}
            />
          </label>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TurmaCombobox school={school} className="md:col-span-2" listId="materiais-turma-suggestions" />

            <label className="md:col-span-2">
              <span className={HUD_SECTION_LABEL}>
                Objetivo pedagógico (opcional)
              </span>
              <textarea
                value={objetivo}
                onChange={(event) => setObjetivo(event.target.value)}
                placeholder={objetivoPlaceholder}
                rows={2}
                className={HUD_TEXTAREA_CLASS}
              />
              {hintFeedback ? (
                <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
                  {hintFeedback}
                </p>
              ) : null}
            </label>

            <label>
              <span className={HUD_SECTION_LABEL}>
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
                <span className={HUD_SECTION_LABEL}>
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
            ) : isExamTool || isPlanoAula ? (
              <label>
                <span className={HUD_SECTION_LABEL}>
                  {isPlanoAula ? "Períodos" : "Quantidade"}
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
            ) : (
              <label>
                <span className={HUD_SECTION_LABEL}>
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
              <span className={HUD_SECTION_LABEL}>
                Observações opcionais
              </span>
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder={observacoesPlaceholder}
                rows={3}
                className={HUD_TEXTAREA_CLASS}
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {showGabarito ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-400/15 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700">
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
                className="pl-hud-btn-secondary rounded-xl px-4 py-3 text-sm font-semibold"
              >
                Limpar
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-50/50 px-4 py-3 text-sm font-bold text-cyan-900">
              <input
                type="checkbox"
                checked={abrirEditorAutomatico}
                onChange={(event) => {
                  const next = event.target.checked;
                  setAbrirEditorAutomatico(next);
                  writeAutoOpenEditorPreference(next);
                }}
                className="h-4 w-4 accent-cyan-600"
              />
              {isPlanoAula
                ? "Abrir no editor automaticamente após gerar (recomendado para ajustar atividades, tempo e exportar)"
                : "Abrir no editor automaticamente após gerar (recomendado para revisar e complementar)"}
            </label>
          </div>

          <GenerationCostHint
            creditCost={getClientCreditCost(tipo)}
            className="mt-4"
          />

          <GenerationErrorBanner
            message={erro}
            cta={erroCta}
            retryable={erroRetryable}
            onRetry={() => void executarGeracao()}
            retrying={loading || retryingGeneration}
            className="mt-4"
          />

          <div className="hidden lg:block">
          <button
            type="submit"
            disabled={loading}
            className="pl-hud-btn-generate mt-5 flex w-full items-center justify-center gap-2 px-6 py-4 text-sm disabled:cursor-not-allowed"
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
          </div>

          <MaterialToolMobileSubmitBar>
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn flex-1 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Gerando…" : `Criar ${mode.shortTitle}`}
            </button>
            <CreditsBalancePill />
          </MaterialToolMobileSubmitBar>
            </>
          )}
        </form>
      }
      preview={
        <>
          {loading ? (
            <div className="space-y-4 p-2">
              <div className="flex min-h-[200px] items-center justify-center">
                <PlanifyOwlGenerationCoach
                  active
                  title={progressLabel || mode.loadingTitle}
                  context="material"
                  toolId={tipo}
                  realProgressPercent={realGenerationProgress}
                  className="max-w-lg"
                />
              </div>
              {showPatienceMessage ? (
                <p className="text-center text-sm font-semibold text-slate-600">
                  Materiais complexos podem levar alguns minutos. Não feche esta página.
                </p>
              ) : null}
              <MaterialPreviewSkeleton />
            </div>
          ) : resultadoHtml ? (
            <div>
              {generationSummary ? (
                <MaterialGenerationSummaryPanel summary={generationSummary} />
              ) : null}
              {typeof qualityScore === "number" ? (
                <MaterialQualityScoreBar
                  score={qualityScore}
                  issues={qualityIssues}
                  onElevate={
                    lastGenerationPayload ? () => void elevarQualidadeMaterial() : undefined
                  }
                  elevating={elevatingQuality}
                />
              ) : null}
              {canRetryExamQuestions ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void regenerarQuestoesFracas()}
                    disabled={loading || retryingExam}
                    className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {retryingExam ? "Corrigindo questões…" : "Corrigir questões fracas"}
                  </button>
                </div>
              ) : null}
              {(pipelineGeracao || alertasGeracao.length > 0) && (
                <div className="mb-4 space-y-3">
                  {pipelineGeracao ? (
                    <p className="text-xs font-bold text-slate-500">
                      Origem:{" "}
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-cyan-800">
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
              {materialSalvo ? (
                <aside className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-black">Salvo no histórico do Planify</p>
                  <p className="mt-1 font-semibold">
                    Revise e complemente no editor antes de exportar. Todas as{" "}
                    {planifyToolCount} ferramentas seguem o mesmo fluxo.
                  </p>
                </aside>
              ) : null}
              {isPlanoAula ? (
                <aside className="mb-4 rounded-2xl border border-cyan-300 bg-gradient-to-r from-cyan-50 to-sky-50 px-5 py-4 text-sm text-cyan-950">
                  <p className="font-black">Próximo passo: refine no editor</p>
                  <p className="mt-1 font-semibold">
                    O preview mostra o rascunho. No editor você ajusta sequência, atividades e
                    tempo antes de exportar para Google Docs.
                  </p>
                  <button
                    type="button"
                    onClick={abrirNoEditor}
                    className="pl-hud-btn mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
                  >
                    <PlanifyIcon name="editor" className="h-4 w-4" />
                    Abrir plano no editor
                  </button>
                </aside>
              ) : null}
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={abrirNoEditor}
                  className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
                >
                  <PlanifyIcon name="editor" className="h-4 w-4" />
                  Editar no editor
                </button>
                <MarketplacePublishButton
                  title={buildTitle(tipo, "", conteudo)}
                  getHtml={() => resultadoHtml}
                  tipoMaterial={mode.title}
                  tema={displayTema}
                  componente={componente}
                  etapa={etapa}
                  anoSerie={anoSerie}
                  disabled={!resultadoHtml}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-900 transition hover:bg-cyan-100"
                />
                <button
                  type="button"
                  onClick={() => void executarGeracao()}
                  disabled={loading}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                  Regenerar
                </button>
                <GoogleDocumentExportBar
                  title={buildTitle(tipo, "", conteudo)}
                  getHtml={() => resultadoHtml}
                  documentType={`material:${tipo}`}
                  returnTo="/dashboard"
                  compact
                  classroomMode="popover"
                  disabled={!resultadoHtml}
                  onStatus={setHintFeedback}
                  onExportError={(error) => {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Falha na exportação para o Google.";
                    setHintFeedback(`Falha na exportação — ${message}`);
                  }}
                />
                <Link
                  href="/historico"
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <PlanifyIcon name="history" className="h-4 w-4" />
                  Histórico
                </Link>
              </div>
              <MaterialTypedPreview html={resultadoHtml} tipoMaterial={tipo} />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-8 text-center">
              <PlanifyOwlMark size={72} glow />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Pré-visualização
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Pronto para criar
              </h3>
              <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                Preencha disciplina, ano escolar e assunto. O resultado aparece
                aqui e pode ir direto para o Editor.
              </p>
            </div>
          )}
        </>
      }
    />
  ) : null;

  if (studioMode) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        {painelCriacao}
      </div>
    );
  }

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          badge="Materiais IA"
          icon="materials"
          title="Escolha uma ferramenta e gere o material"
          description="Catálogo organizado por categoria — clique na ferramenta para abrir o painel de criação com IA."
        />
      }
    >
    <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5">
      {/* Catálogo (visível quando painel fechado) */}
      {!modalAberto ? (
        <>
        {/* Catálogo + busca + categorias */}
        <section className="pl-hud-glass rounded-2xl p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <span className="pl-hud-badge">
                <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                Criar com IA
              </span>
              <h1 className="mt-2 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                Escolha uma ferramenta e gere o material em segundos.
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-snug text-slate-500">
                Catálogo organizado por categoria. Clique na ferramenta para abrir o painel de criação com IA.
              </p>
            </div>

            <div className="relative">
              <PlanifyIcon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar ferramenta..."
                aria-label="Buscar ferramenta"
                className={`${HUD_FIELD_CLASS} py-3.5 pl-12 pr-4`}
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
                  className={
                    active ? HUD_FILTER_CHIP_ACTIVE : HUD_FILTER_CHIP_INACTIVE
                  }
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
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {ferramentasFiltradas.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selecionarFerramenta(item.id)}
                className="pl-hud-hub-app group relative min-h-[156px] p-4 text-left transition hover:-translate-y-0.5"
              >
                {item.popular ? (
                  <span className="absolute right-3 top-3 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                    Top
                  </span>
                ) : null}
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-sm transition group-hover:scale-110`}>
                  <PlanifyIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold leading-tight text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-slate-500">
                  {item.description}
                </p>
              </button>
            ))}
          </section>
        ) : (
          <section className="pl-hud-glass flex flex-col items-center rounded-2xl px-6 py-10 text-center">
            <PlanifyOwlMark size={64} glow />
            <p className="mt-4 text-sm font-bold text-slate-600">
              Nenhuma ferramenta encontrada para essa busca ou categoria.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusca("");
                setCategoria("todos");
              }}
              className="pl-hud-btn-secondary mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Limpar filtros
            </button>
          </section>
        )}

        {/* Materiais recentes (histórico) */}
        {historico.length > 0 ? (
          <section className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                  Materiais recentes
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  Sincronizado com o histórico global — abra no editor para editar.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/historico"
                  className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  Ver histórico
                </Link>
                <button
                  type="button"
                  onClick={limparHistorico}
                  className="pl-hud-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {historico.slice(0, 6).map((item) => {
                const itemTool = getPlanifyTool(item.tipo);
                const title = item.tema || itemTool.shortTitle;
                return (
                  <PlanifyMaterialHubCard
                    key={item.id}
                    badge={itemTool.shortTitle}
                    title={title}
                    description={item.componente ? `Componente: ${item.componente}` : undefined}
                    metaPrimary={[item.componente, item.anoSerie]
                      .filter(Boolean)
                      .join(" · ")}
                    metaSecondary={
                      item.createdAt ? formatDate(item.createdAt) : undefined
                    }
                    onSelect={() => reabrirHistorico(item)}
                    footer={
                      <button
                        type="button"
                        onClick={() => abrirHistoricoNoEditor(item)}
                        className="pl-hud-btn flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
                        Abrir no editor
                      </button>
                    }
                  />
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
