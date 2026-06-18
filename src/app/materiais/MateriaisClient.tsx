"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { GoogleSlidesExportButton } from "@/components/google/GoogleSlidesExportButton";
import { SlidesPptxDownloadButton } from "@/components/documents/SlidesPptxDownloadButton";
import { SlideAiAdjustPanel } from "@/components/slides/SlideAiAdjustPanel";
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
import { requestSlideImagesRetry } from "@/lib/materiais/material-images-retry-client";
import { MarketplacePublishButton } from "@/components/marketplace/MarketplacePublishButton";
import type {
  MaterialEngineInput,
  MaterialEngineResponse,
} from "@/server/materials/material-engine-types";
import { SLIDE_THEME_OPTIONS } from "@/server/materials/slide-design-themes";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { ToolStudioShell } from "@/components/studio/ToolStudioShell";
import { ExportDock } from "@/components/studio/ExportDock";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import {
  HUD_CHIP_ACTIVE,
  HUD_CHIP_INACTIVE,
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
import { toolSupportsGabarito } from "@/lib/educacao/material-form-config";
import {
  defaultQuantityForTool,
  defaultSlidesQuestionQuantity,
  getQuantityPresets,
  SLIDES_QUESTION_QUANTITY_PRESETS,
} from "@/lib/educacao/material-quantity-presets";
import {
  clearMaterialHistory,
  loadMaterialHistoryPreview,
  loadMaterialMetaFromHistoryId,
  openMaterialInEditor,
  persistGeneratedMaterial,
  clearSlideGenerationPayload,
  persistSlideGenerationPayload,
  readAutoOpenEditorPreference,
  readSlideGenerationPayload,
  writeAutoOpenEditorPreference,
  type MaterialEditorMeta,
  type MaterialHistoryPreview,
} from "@/lib/materiais/material-editor-flow";
import { buildMaterialGenerationSummary } from "@/lib/materiais/material-generation-summary";
import {
  getPlanifyTool,
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
import {
  isFastDeliveryPipeline,
  resolveUnifiedPipelineLabel,
} from "@/lib/materiais/unified-pipeline-labels";
import { UNIFIED_ELEVATE_BANNER_THRESHOLD } from "@/lib/materiais/unified-quality-gate";
import {
  buildPedagogicalObservacoes,
  fetchPedagogicalContext,
  type PedagogicalContextEntry,
} from "@/lib/pedagogical-cache/pedagogical-context-client";
import { lessonBundleFollowUp } from "@/lib/pro/teachyStudio";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import { MaterialBnccSkillsPanel } from "@/components/bncc/MaterialBnccSkillsPanel";
import { TemaCombobox } from "@/components/bncc/TemaCombobox";
import type { BnccTemaAutocompleteSuggestion } from "@/lib/bncc/bncc-tema-autocomplete";
import { PlanifyMaterialHubCard } from "@/components/materials/PlanifyMaterialHubCard";
import {
  groupBnccSkillsFromResponse,
  mapSelectedBnccSkillsToPayload,
  normalizeBnccSkillOption,
  splitTopicLines,
  validateSelectedBnccSkillsForStage,
  type BnccSkillGroup,
  type BnccSkillOption,
} from "@/lib/bncc/bncc-suggestion-ui";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

const SELECT_FIELD_CLASS = HUD_FIELD_CLASS;
const PATIENCE_THRESHOLD_MS = 60_000;
const LONG_GENERATION_TYPES = new Set([
  "slides",
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
  inclusao: [
    "Atividade sobre frações adaptada para TDAH",
    "Relatório de progresso — participação em grupo",
    "Trilhas paralelas sobre sistema solar",
  ],
  "aula-completa": [
    "Revolução Industrial — pacote completo",
    "Frações no cotidiano — aula integrada",
    "Sistema solar — plano, slides e avaliação",
  ],
  "correcao-ia": [
    "Redação sobre mobilidade urbana",
    "Questão discursiva de História",
    "Produção textual — carta argumentativa",
  ],
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
  /** Rollback: layout anterior sem ExportDock fixo. */
  legacyLayout?: boolean;
};

export function MateriaisClient({
  studioMode = false,
  initialTipo,
  initialTema = "",
  onStudioClose,
  onOpenRelatedTool,
  legacyLayout = false,
}: MateriaisClientProps = {}) {
  const useStudioExportDock = studioMode && !legacyLayout;
  const school = useSchoolClasses();
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
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [lastGenerationPayload, setLastGenerationPayload] =
    useState<MaterialEngineInput | null>(null);
  const [elevatingQuality, setElevatingQuality] = useState(false);
  const [retryingImages, setRetryingImages] = useState(false);
  const [retryingExam, setRetryingExam] = useState(false);
  const [adjustingSlides, setAdjustingSlides] = useState(false);
  const [conteudosSugeridos, setConteudosSugeridos] = useState<
    ConteudoSugerido[] | null
  >(null);
  const [conteudosSelecionadosIds, setConteudosSelecionadosIds] = useState<
    string[]
  >([]);
  const [temasRapidosSelecionados, setTemasRapidosSelecionados] = useState<
    string[]
  >([]);
  const [designSlides, setDesignSlides] = useState<string>("moderno");
  const [sugerindoConteudos, setSugerindoConteudos] = useState(false);
  const [quantidade, setQuantidade] = useState(
    defaultQuantityForTool(initialTipo ?? "slides"),
  );
  const [dificuldade, setDificuldade] = useState<Dificuldade>("media");
  const [formatoJogo, setFormatoJogo] = useState<FormatoJogo>("caca-palavras");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [incluirQuestoes, setIncluirQuestoes] = useState(false);
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(
    defaultSlidesQuestionQuantity(),
  );
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
  const [bnccGroups, setBnccGroups] = useState<BnccSkillGroup[]>([]);
  const [selectedBnccSkills, setSelectedBnccSkills] = useState<BnccSkillOption[]>(
    [],
  );
  const [loadingBncc, setLoadingBncc] = useState(false);
  const [bnccRegistroFeedback, setBnccRegistroFeedback] = useState<{
    count: number;
    inferred: boolean;
  } | null>(null);
  const [pedagogicalEntries, setPedagogicalEntries] = useState<
    PedagogicalContextEntry[]
  >([]);
  const [pedagogicalTokensSaved, setPedagogicalTokensSaved] = useState(0);
  const [loadingPedagogical, setLoadingPedagogical] = useState(false);
  const [pedagogicalExpanded, setPedagogicalExpanded] = useState(true);
  const [usePedagogicalOnly, setUsePedagogicalOnly] = useState(false);
  const pedagogicalDebounceRef = useRef<number | null>(null);

  function rememberSlideGenerationPayload(payload: MaterialEngineInput | null) {
    setLastGenerationPayload(payload);
    if (!payload) {
      clearSlideGenerationPayload();
      return;
    }
    if (payload.tipoMaterial === "slides") {
      persistSlideGenerationPayload(payload);
    }
  }

  const slideAdjustPayload =
    lastGenerationPayload ??
    (tipo === "slides" ? readSlideGenerationPayload() : null);

  function resetBnccSelection(clearSuggestions = true) {
    if (clearSuggestions) setBnccGroups([]);
    setSelectedBnccSkills([]);
    setBnccRegistroFeedback(null);
  }

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

    if (planifyTools.some((tool) => tool.id === tipoUrl)) {
      setTipo(tipoUrl as PlanifyToolId);
      setModalAberto(true);
    }

    if (toolCategories.some((category) => category.id === categoriaUrl)) {
      setCategoria(categoriaUrl as ToolCategoryId);
    }

    setHistorico(loadMaterialHistoryPreview());
    setAbrirEditorAutomatico(readAutoOpenEditorPreference());
    const restoredPayload = readSlideGenerationPayload();
    if (restoredPayload) {
      setLastGenerationPayload(restoredPayload);
    }
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
    resetBnccSelection(true);
  }, [etapa, anoSerie, areaConhecimento, componente]);

  useEffect(() => {
    setBnccGroups([]);
    setBnccRegistroFeedback(null);
  }, [tema]);

  const loadPedagogicalContext = useCallback(async () => {
    if (!tema.trim() && selectedBnccSkills.length === 0) {
      setPedagogicalEntries([]);
      setPedagogicalTokensSaved(0);
      return;
    }

    setLoadingPedagogical(true);
    try {
      const data = await fetchPedagogicalContext({
        tema: tema.trim(),
        componente,
        etapa,
        anoSerie,
        bnccCodigos: selectedBnccSkills.map((s) => s.codigo),
      });

      if (data.success && data.kind === "cache_hit" && data.entries.length) {
        setPedagogicalEntries(data.entries);
        setPedagogicalTokensSaved(data.tokensSaved ?? 0);
      } else {
        setPedagogicalEntries([]);
        setPedagogicalTokensSaved(0);
      }
    } catch {
      setPedagogicalEntries([]);
      setPedagogicalTokensSaved(0);
    } finally {
      setLoadingPedagogical(false);
    }
  }, [tema, componente, etapa, anoSerie, selectedBnccSkills]);

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
    if (!studioMode) return;

    function onObjetivoHint(event: Event) {
      const snippet = (event as CustomEvent<string>).detail;
      if (!snippet || typeof snippet !== "string") return;
      setObjetivo((prev) => {
        const lines = prev
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        const hasSnippet = lines.some((line) => line === snippet.trim());
        const next = hasSnippet
          ? lines.filter((line) => line !== snippet.trim())
          : [...lines, snippet.trim()];
        return next.join("\n");
      });
      setHintFeedback(
        "Personalização aplicada — clique em Criar para gerar com esse ajuste.",
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

  useEffect(() => {
    if (!studioMode || typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("planify-objetivo-updated", { detail: objetivo }),
    );
  }, [objetivo, studioMode]);

  useEffect(() => {
    if (tipo !== "prova" && tipo !== "lista") return;
    const injected = readProvaInjectObservacoes();
    if (!injected) return;
    setObservacoes((prev) => (prev.trim() ? `${prev.trim()}\n\n${injected}` : injected));
    setHintFeedback("Questões do banco importadas — revise e clique em Criar.");
  }, [tipo]);

  const mode = useMemo(() => getPlanifyTool(tipo), [tipo]);
  const generationSummary = useMemo(
    () =>
      resultadoHtml
        ? buildMaterialGenerationSummary({
            tipo,
            html: resultadoHtml,
            estrutura: resultadoEstrutura,
            designSlides: tipo === "slides" ? designSlides : undefined,
            incluirGabarito,
          })
        : null,
    [
      resultadoHtml,
      resultadoEstrutura,
      tipo,
      designSlides,
      incluirGabarito,
    ],
  );
  const pipelineDisplayLabel = useMemo(
    () => resolveUnifiedPipelineLabel(pipelineGeracao),
    [pipelineGeracao],
  );
  const showFastDraftBanner = useMemo(() => {
    if (typeof qualityScore !== "number") return false;
    if (qualityScore >= UNIFIED_ELEVATE_BANNER_THRESHOLD) return false;
    return isFastDeliveryPipeline(pipelineGeracao);
  }, [qualityScore, pipelineGeracao]);
  const isJogo = tipo === "jogo";
  const isRedacao = tipo === "redacao";
  const isExamTool = tipo === "lista" || tipo === "prova";
  const showGabarito = toolSupportsGabarito(tipo, {
    incluirQuestoes: tipo === "slides" ? incluirQuestoes : undefined,
  });

  const canRetrySlideImages = useMemo(() => {
    if (tipo !== "slides" || !resultadoEstrutura?.slides?.length) return false;
    return resultadoEstrutura.slides.some(
      (slide) =>
        slide.layout !== "fechamento" &&
        !slide.imageUrl?.trim() &&
        Boolean(slide.imagePrompt?.trim() || slide.title?.trim()),
    );
  }, [tipo, resultadoEstrutura]);

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

  const suggestContextReady = Boolean(
    tema.trim() && componente.trim() && anoSerie.trim(),
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
    if (tipo !== "slides") {
      setIncluirQuestoes(false);
      setQuantidadeQuestoes(defaultSlidesQuestionQuantity());
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
    "Ex.: desenvolver argumentação, revisar conceitos-chave, trabalhar leitura crítica...";

  const observacoesPlaceholder = isRedacao
    ? "Ex.: dissertação argumentativa, 25–30 linhas, foco em proposta de intervenção..."
    : "Ex.: linguagem simples, tempo de aula de 50 min, turma com dificuldade em leitura...";

  const gabaritoLabel = isRedacao
    ? "Incluir critérios de avaliação e redação modelo"
    : tipo === "slides" && incluirQuestoes
      ? "Incluir gabarito no último slide (opcional)"
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
    setResultadoEstrutura(null);
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
        credentials: "include",
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
        error?: { message?: string; details?: string };
      };

      if (!response.ok || !data?.success || !data.data?.conteudos?.length) {
        throw new Error(
          data?.error?.details ||
            data?.error?.message ||
            "Não foi possível sugerir conteúdos agora.",
        );
      }

      setConteudosSugeridos(data.data.conteudos);
      setConteudosSelecionadosIds([]);
      if (data.data.alertas?.length) {
        setAlertasGeracao(data.data.alertas);
      }
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setSugerindoConteudos(false);
    }
  }

  function toggleConteudoSugerido(id: string) {
    setConteudosSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function aplicarConteudosSelecionados() {
    const items =
      conteudosSugeridos?.filter((item) =>
        conteudosSelecionadosIds.includes(item.id),
      ) ?? [];

    if (!items.length) return;

    setTema(items.map((item) => item.titulo).join(" · "));

    const objetivos = items.flatMap((item) => item.objetivos || []);
    if (objetivos.length) {
      setObjetivo(objetivos.join("\n"));
    }

    const blocoObservacoes = items
      .map((item) => `${item.titulo}: ${item.descricao}`)
      .join("\n\n");

    setObservacoes((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${blocoObservacoes}` : blocoObservacoes,
    );
  }

  function toggleTemaRapido(item: string) {
    setTemasRapidosSelecionados((prev) => {
      const next = prev.includes(item)
        ? prev.filter((value) => value !== item)
        : [...prev, item];

      if (tipo === "slides" && next.length > 0) {
        setTema(next.join(" · "));
      } else if (next.length === 1) {
        setTema(next[0]);
      } else if (next.length === 0) {
        setTema("");
      }

      return next;
    });
  }

  function limparFormulario() {
    setTema("");
    applyEducation(educationDefaultsForTool(tipo, DEFAULT_MATERIAL_EDUCATION));
    setObjetivo("");
    setObservacoes("");
    setAlertasGeracao([]);
    setPipelineGeracao(null);
    setQualityScore(null);
    setQualityIssues([]);
    rememberSlideGenerationPayload(null);
    setConteudosSugeridos(null);
    setConteudosSelecionadosIds([]);
    setTemasRapidosSelecionados([]);
    setQuantidade(defaultQuantityForTool(tipo));
    setDificuldade("media");
    setFormatoJogo("caca-palavras");
    setIncluirGabarito(true);
    setIncluirQuestoes(false);
    setQuantidadeQuestoes(defaultSlidesQuestionQuantity());
    setResultadoHtml("");
    setResultadoEstrutura(null);
    setErro("");
    resetBnccSelection(true);
  }

  function buildBnccSuggestPayload() {
    const topicLines = splitTopicLines(tema);
    const conteudos =
      topicLines.length > 1 ? topicLines : tema.trim() || topicLines[0] || "";

    return {
      etapa,
      anoSerie,
      areaConhecimento,
      componenteCurricular: componente,
      conteudos,
      temaCentral: tema.trim() || undefined,
      objetivosGerais: objetivo.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      ...school.turmaPayload,
      discipline: componente.trim() || undefined,
      disciplina: componente.trim() || undefined,
    };
  }

  async function sugerirHabilidadesBncc() {
    setErro("");

    if (!tema.trim()) {
      setErro("Informe o tema antes de sugerir habilidades BNCC.");
      return;
    }

    if (!componente.trim() || !anoSerie.trim()) {
      setErro("Informe disciplina e ano/série para sugerir habilidades BNCC.");
      return;
    }

    setLoadingBncc(true);

    try {
      const response = await planifyAuthenticatedFetch("/api/bncc/sugerir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBnccSuggestPayload()),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        conteudos?: unknown;
        error?: { message?: string };
      } | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error?.message || "Não foi possível sugerir habilidades BNCC.",
        );
      }

      const topicLines = splitTopicLines(tema);
      setBnccGroups(
        groupBnccSkillsFromResponse(data as Record<string, unknown>, topicLines),
      );
      setSelectedBnccSkills([]);
      setBnccRegistroFeedback(null);
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setLoadingBncc(false);
    }
  }

  function handleTemaSuggestionSelect(suggestion: BnccTemaAutocompleteSuggestion) {
    const habilidades = suggestion.habilidades.map((skill) =>
      normalizeBnccSkillOption(skill, suggestion.tema),
    );

    setBnccGroups([
      {
        conteudo: suggestion.tema,
        habilidades,
      },
    ]);
    setSelectedBnccSkills(habilidades.slice(0, 3));
    setBnccRegistroFeedback(null);
  }

  function toggleBnccSkill(skill: BnccSkillOption) {
    setSelectedBnccSkills((current) => {
      const exists = current.some((item) => item.id === skill.id);
      return exists
        ? current.filter((item) => item.id !== skill.id)
        : [...current, skill];
    });
    setBnccRegistroFeedback(null);
  }

  function selectBnccGroup(group: BnccSkillGroup) {
    setSelectedBnccSkills((current) => {
      const map = new Map(current.map((skill) => [skill.id, skill]));
      for (const skill of group.habilidades.slice(0, 3)) {
        map.set(skill.id, skill);
      }
      return Array.from(map.values());
    });
    setBnccRegistroFeedback(null);
  }

  function clearBnccGroup(group: BnccSkillGroup) {
    setSelectedBnccSkills((current) =>
      current.filter(
        (skill) => !group.habilidades.some((item) => item.id === skill.id),
      ),
    );
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
      tema,
      temaCentral: tema,
      objetivo: objetivoComposto,
      objetivos: objetivoComposto,
      observacoes: pedagogicalObs,
      quantidade,
      dificuldade,
      formatoJogo: isJogo ? formatoJogo : null,
      incluirGabarito: showGabarito && incluirGabarito,
      incluirQuestoes: tipo === "slides" && incluirQuestoes ? true : undefined,
      quantidadeQuestoes:
        tipo === "slides" && incluirQuestoes ? quantidadeQuestoes : undefined,
      areaConhecimento,
      designSlides: tipo === "slides" ? designSlides : undefined,
      ...school.turmaPayload,
      discipline: componente.trim() || undefined,
      disciplina: componente.trim() || undefined,
      habilidadesSelecionadas: mapSelectedBnccSkillsToPayload(
        selectedBnccSkills,
        { etapa, anoSerie, areaConhecimento, componente },
      ),
      habilidadesBncc: mapSelectedBnccSkillsToPayload(selectedBnccSkills, {
        etapa,
        anoSerie,
        areaConhecimento,
        componente,
      }),
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
      tema,
      componente,
      anoSerie,
      etapa,
      areaConhecimento,
      pipeline: pipeline ?? pipelineGeracao,
      slideTheme:
        resolvedEstrutura?.slideTheme ||
        (tipo === "slides" ? designSlides : null),
      designSlides: tipo === "slides" ? designSlides : null,
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
    setTema(item.tema);
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
      rememberSlideGenerationPayload(payload);
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

  function abrirFerramentaRelacionada(toolId: PlanifyToolId) {
    try {
      if (tema.trim()) {
        sessionStorage.setItem("planify-studio-tema", tema.trim());
      }
      sessionStorage.setItem(
        "planify-studio-objetivo-hint",
        "Manter o mesmo tema e a continuidade pedagógica da aula já iniciada.",
      );
    } catch {
      /* ignore */
    }

    if (onOpenRelatedTool) {
      onOpenRelatedTool(toolId);
      return;
    }

    window.location.href = `/dashboard?tipo=${encodeURIComponent(toolId)}`;
  }

  function abrirNoEditor() {
    if (!resultadoHtml) {
      setErro("Gere um material antes de abrir no editor.");
      return;
    }

    openMaterialInEditor(
      resultadoHtml,
      buildTitle(tipo, tema),
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

    const bnccValidationError =
      selectedBnccSkills.length > 0
        ? validateSelectedBnccSkillsForStage(
            selectedBnccSkills,
            etapa,
            anoSerie,
          )
        : null;
    if (bnccValidationError) {
      setErro(bnccValidationError);
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
    setBnccRegistroFeedback(null);
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
      rememberSlideGenerationPayload(payload);

      let data: Record<string, unknown>;
      try {
        if (isMaterialStreamType(tipo)) {
          const streamResult = await requestMaterialGenerationStream(payload, {
            onProgress: ({ phase, message, progress, index, total }) => {
              if (typeof progress === "number") {
                setRealGenerationProgress(progress);
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
          setPipelineGeracao(record.pipeline);
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

      const titulo = buildTitle(tipo, tema);
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
      setBnccRegistroFeedback({
        count: selectedBnccSkills.length,
        inferred: false,
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
      rememberSlideGenerationPayload(payload);

      const titulo = buildTitle(tipo, tema);
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

  async function regenerarImagensSlides() {
    if (!lastGenerationPayload || !resultadoEstrutura) {
      setErro("Gere os slides antes de tentar resolver imagens.");
      return;
    }

    setRetryingImages(true);
    setErro("");

    try {
      const result = await requestSlideImagesRetry({
        ...lastGenerationPayload,
        estrutura: resultadoEstrutura,
      });
      window.dispatchEvent(new Event("planify:credits-changed"));
      setResultadoHtml(result.html);
      setResultadoEstrutura(result.estrutura);

      const titulo = buildTitle(tipo, tema);
      const meta = buildMaterialMeta(pipelineGeracao, result.estrutura, {
        qualityScore,
        qualityIssues,
        generationPayload: lastGenerationPayload,
      });
      persistGeneratedMaterial(result.html, titulo, meta);
      setMaterialSalvo(true);
      setHistorico(loadMaterialHistoryPreview());
      setHintFeedback(
        result.imagesResolved > 0
          ? `${result.imagesResolved} imagem(ns) resolvida(s) — revise os slides.`
          : "Nenhuma imagem pendente encontrada.",
      );
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setRetryingImages(false);
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

      const titulo = buildTitle(tipo, tema);
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

  function handleSlideAiAdjustResult(result: {
    html: string;
    estrutura: MaterialEngineResponse | null;
    payload: MaterialEngineInput;
    qualityScore?: number | null;
    qualityIssues?: string[];
    alertas?: string[];
    pipeline?: string | null;
  }) {
    window.dispatchEvent(new Event("planify:credits-changed"));
    setResultadoHtml(result.html);
    setResultadoEstrutura(result.estrutura);
    rememberSlideGenerationPayload(result.payload);
    if (result.alertas?.length) setAlertasGeracao(result.alertas);
    if (typeof result.qualityScore === "number") {
      setQualityScore(result.qualityScore);
    }
    if (result.qualityIssues) setQualityIssues(result.qualityIssues);
    if (result.pipeline) setPipelineGeracao(result.pipeline);

    const titulo = buildTitle(tipo, tema);
    const meta = buildMaterialMeta(result.pipeline ?? pipelineGeracao, result.estrutura, {
      qualityScore: result.qualityScore ?? qualityScore,
      qualityIssues: result.qualityIssues ?? qualityIssues,
      generationPayload: result.payload,
    });
    persistGeneratedMaterial(result.html, titulo, meta);
    setMaterialSalvo(true);
    setHistorico(loadMaterialHistoryPreview());
    setHintFeedback("Ajuste aplicado — revise os slides antes de salvar ou exportar.");
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

  const exportDockStatusMessage =
    useStudioExportDock &&
    typeof qualityScore === "number" &&
    qualityScore < UNIFIED_ELEVATE_BANNER_THRESHOLD
      ? "Score abaixo do ideal — revise ou use Elevar qualidade antes de exportar."
      : null;

  const studioExportDock =
    useStudioExportDock && resultadoHtml ? (
      <ExportDock
        visible
        disabled={!resultadoHtml}
        statusMessage={exportDockStatusMessage}
      >
        {tipo === "slides" ? (
          <>
            <GoogleSlidesExportButton
              title={buildTitle(tipo, tema)}
              html={resultadoHtml}
              slides={resultadoEstrutura?.slides}
              theme={resultadoEstrutura?.slideTheme || designSlides}
              returnTo="/dashboard?tipo=slides"
              alwaysShowExport
              iconOnly={false}
            />
            <SlidesPptxDownloadButton
              title={buildTitle(tipo, tema)}
              html={resultadoHtml}
              slides={resultadoEstrutura?.slides}
              theme={resultadoEstrutura?.slideTheme || designSlides}
              documentType="material:slides"
              iconOnly={false}
              label="Baixar PPTX"
            />
          </>
        ) : null}
        <GoogleDocumentExportBar
          title={buildTitle(tipo, tema)}
          getHtml={() => resultadoHtml}
          documentType={`material:${tipo}`}
          isSlideDeck={tipo === "slides"}
          returnTo="/dashboard"
          compact
          classroomMode="popover"
          disabled={!resultadoHtml}
        />
        <button
          type="button"
          onClick={abrirNoEditor}
          className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
        >
          <PlanifyIcon name="editor" className="h-4 w-4" />
          Editor
        </button>
        <button
          type="button"
          onClick={() => void executarGeracao()}
          disabled={loading}
          className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlanifyIcon name="spark" className="h-4 w-4" />
          Regenerar
        </button>
        <MarketplacePublishButton
          title={buildTitle(tipo, tema)}
          getHtml={() => resultadoHtml}
          tipoMaterial={mode.title}
          tema={tema}
          componente={componente}
          etapa={etapa}
          anoSerie={anoSerie}
          disabled={!resultadoHtml}
          className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-900 transition hover:bg-cyan-100"
        />
        <Link
          href="/historico"
          className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
        >
          <PlanifyIcon name="history" className="h-4 w-4" />
          Histórico
        </Link>
      </ExportDock>
    ) : null;

  const ToolShell = studioMode ? ToolStudioShell : MaterialToolPageShell;

  const painelCriacao = modalAberto ? (
      <ToolShell
      tool={mode}
      studioMode={studioMode}
      onBack={fecharPainel}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={Boolean(resultadoHtml)}
      previewLoading={loading}
      {...(studioMode ? { legacyLayout, exportDock: studioExportDock } : {})}
      form={
        <form onSubmit={gerarMaterial} className="space-y-1 max-lg:pb-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {studioMode ? (
              <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Configurar geração
              </p>
            ) : (
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
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

          <TemaCombobox
            className="mt-5"
            label={mode.primaryFieldLabel}
            value={tema}
            onChange={setTema}
            onSelectSuggestion={handleTemaSuggestionSelect}
            etapa={etapa}
            anoSerie={anoSerie}
            componente={componente}
          />

          {(loadingPedagogical || pedagogicalEntries.length > 0) ? (
            <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-50/60">
              <button
                type="button"
                onClick={() => setPedagogicalExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="text-xs font-black uppercase tracking-wide text-emerald-900">
                  Contexto verificado
                </span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white">
                  Fonte revisada — sem custo de IA
                </span>
              </button>
              {pedagogicalExpanded ? (
                <div className="border-t border-emerald-400/20 px-4 py-3">
                  {loadingPedagogical ? (
                    <p className="text-xs font-semibold text-emerald-800">
                      Buscando contexto no reservatório…
                    </p>
                  ) : (
                    <>
                      {pedagogicalEntries.map((entry) => (
                        <div key={entry.id} className="mb-3 last:mb-0">
                          <p className="text-sm font-black text-slate-900">
                            {entry.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                            {entry.summary}
                          </p>
                          {entry.sourceUrl ? (
                            <a
                              href={entry.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-[11px] font-bold text-emerald-800 underline"
                            >
                              {entry.sourceTitle || "Ver fonte"}
                            </a>
                          ) : null}
                        </div>
                      ))}
                      {pedagogicalTokensSaved > 0 ? (
                        <p className="text-[11px] font-bold text-emerald-800">
                          ~{pedagogicalTokensSaved.toLocaleString("pt-BR")} tokens economizados nesta consulta.
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUsePedagogicalOnly(true);
                            setObservacoes(
                              buildPedagogicalObservacoes(
                                pedagogicalEntries,
                                observacoes.trim(),
                              ),
                            );
                          }}
                          className="rounded-full border border-emerald-600 bg-white px-3 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                        >
                          Usar só este contexto
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsePedagogicalOnly(false)}
                          className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                            !usePedagogicalOnly
                              ? "bg-emerald-600 text-white"
                              : "border border-emerald-400/40 bg-white text-emerald-800"
                          }`}
                        >
                          Injetar na geração completa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {(sugestoesTema[tipo] || []).map((item) => {
              const selected = temasRapidosSelecionados.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    tipo === "slides"
                      ? toggleTemaRapido(item)
                      : setTema(item)
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                    selected ? HUD_CHIP_ACTIVE : HUD_CHIP_INACTIVE
                  }`}
                  aria-pressed={tipo === "slides" ? selected : undefined}
                >
                  {tipo === "slides" && selected ? "✓ " : ""}
                  {item}
                </button>
              );
            })}
          </div>
          {tipo === "slides" && temasRapidosSelecionados.length > 1 ? (
            <p className="mt-2 text-[11px] font-semibold text-cyan-700">
              {temasRapidosSelecionados.length} assuntos combinados no tema — a IA
              montará a sequência pedagógica dos slides.
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TurmaCombobox school={school} className="md:col-span-2" listId="materiais-turma-suggestions" />

            {suggestContextReady ? (
              <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/15 bg-white/80 px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Contexto
                </span>
                <span className={HUD_CHIP_ACTIVE}>{etapa}</span>
                <span className={HUD_CHIP_ACTIVE}>{anoSerie}</span>
                <span className={HUD_CHIP_ACTIVE}>{componente}</span>
              </div>
            ) : (
              <p className="md:col-span-2 text-xs font-semibold text-amber-800">
                Preencha tema, disciplina e ano/série para liberar sugestões de conteúdo
                e habilidades BNCC.
              </p>
            )}

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => void sugerirConteudosComIA()}
                disabled={sugerindoConteudos || loading || !suggestContextReady}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 transition hover:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                {sugerindoConteudos ? "Sugerindo..." : "Sugerir conteúdos"}
              </button>
            </div>

            {conteudosSugeridos && conteudosSugeridos.length > 0 ? (
              <div className="md:col-span-2 rounded-xl border border-cyan-400/20 bg-cyan-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-800">
                    Sugestões de conteúdo (IA)
                  </p>
                  <p className="text-[11px] font-semibold text-cyan-700">
                    {tipo === "slides"
                      ? "Selecione vários tópicos para compor a sequência da aula"
                      : "Clique para marcar um ou mais conteúdos"}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {conteudosSugeridos.map((item) => {
                    const selected = conteudosSelecionadosIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleConteudoSugerido(item.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                          selected
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-sm"
                            : "border-cyan-400/25 bg-white text-slate-700 hover:border-cyan-500 hover:text-cyan-900"
                        }`}
                        title={item.descricao}
                        aria-pressed={selected}
                      >
                        {selected ? "✓ " : ""}
                        {item.titulo}
                      </button>
                    );
                  })}
                </div>
                {conteudosSelecionadosIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={aplicarConteudosSelecionados}
                    className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                  >
                    Aplicar {conteudosSelecionadosIds.length} selecionado
                    {conteudosSelecionadosIds.length > 1 ? "s" : ""} ao tema
                  </button>
                ) : null}
              </div>
            ) : null}

            <MaterialBnccSkillsPanel
              groups={bnccGroups}
              selectedSkills={selectedBnccSkills}
              loading={loadingBncc}
              temaReady={suggestContextReady}
              optional
              onSuggest={() => void sugerirHabilidadesBncc()}
              onToggleSkill={toggleBnccSkill}
              onSelectGroup={selectBnccGroup}
              onClearGroup={clearBnccGroup}
              onClearAll={() => resetBnccSelection(false)}
            />

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
            ) : isExamTool ? (
              <div>
                <span className={HUD_SECTION_LABEL}>Quantidade</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quantityPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setQuantidade(preset.value)}
                      className={
                        quantidade === preset.value
                          ? HUD_FILTER_CHIP_ACTIVE
                          : HUD_FILTER_CHIP_INACTIVE
                      }
                    >
                      {preset.label.replace(/\s.*/, "")}
                    </button>
                  ))}
                </div>
              </div>
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

          {tipo === "slides" ? (
            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={incluirQuestoes}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setIncluirQuestoes(next);
                      if (!next) {
                        setIncluirGabarito(false);
                      }
                    }}
                    className="h-4 w-4 accent-cyan-600"
                  />
                  Incluir questões nos slides
                </label>
                {incluirQuestoes ? (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>Quantidade de questões</span>
                    <select
                      value={quantidadeQuestoes}
                      onChange={(event) =>
                        setQuantidadeQuestoes(event.target.value)
                      }
                      className="rounded-lg border border-cyan-400/25 bg-white px-2 py-1.5 text-xs font-bold text-slate-800"
                    >
                      {SLIDES_QUESTION_QUANTITY_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              {incluirQuestoes ? (
                <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">
                  As questões entram nos slides de prática; o gabarito, se marcado,
                  aparece somente no último slide.
                </p>
              ) : null}
            </div>
          ) : null}

          {tipo === "slides" ? (
            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  Design da apresentação
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  O tema é aplicado ao gerar — altere e clique em Gerar novamente
                </p>
              </div>
              <div className="mt-3 grid max-h-[28rem] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {SLIDE_THEME_OPTIONS.map((tema) => {
                  const selected = designSlides === tema.id;
                  return (
                    <button
                      key={tema.id}
                      type="button"
                      onClick={() => setDesignSlides(tema.id)}
                      aria-pressed={selected}
                      className={`overflow-hidden rounded-xl border text-left transition ${
                        selected
                          ? "border-cyan-500 ring-2 ring-cyan-200"
                          : "border-cyan-400/20 hover:border-cyan-400/50"
                      }`}
                    >
                      <span
                        className="relative flex h-14 items-end gap-1.5 p-2"
                        style={{
                          background: `linear-gradient(135deg, ${tema.preview[0]}, ${tema.preview[1]}, ${tema.preview[2]})`,
                        }}
                      >
                        <span
                          className="h-2 w-10 rounded-full shadow-sm"
                          style={{
                            background: tema.dark
                              ? "rgba(255,255,255,0.85)"
                              : tema.preview[2],
                          }}
                        />
                        <span
                          className="h-2 w-6 rounded-full"
                          style={{
                            background: tema.dark
                              ? tema.preview[1]
                              : "rgba(255,255,255,0.65)",
                          }}
                        />
                        {tema.dark ? (
                          <span className="absolute right-2 top-2 rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/90">
                            Escuro
                          </span>
                        ) : null}
                      </span>
                      <span className="block bg-white px-3 py-2">
                        <span className="flex items-center gap-1 text-xs font-black text-slate-800">
                          {selected ? "✓ " : ""}
                          {tema.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-500">
                          {tema.descricao}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
              ) : tipo === "slides" ? (
                <span className="text-sm font-semibold text-slate-500">
                  Marque &quot;Incluir questões nos slides&quot; para opcionalmente
                  adicionar gabarito no último slide.
                </span>
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
              Abrir no editor automaticamente após gerar (recomendado para revisar e complementar)
            </label>
          </div>

          {bnccRegistroFeedback ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-900">
              <strong className="font-black">
                {bnccRegistroFeedback.count} habilidade
                {bnccRegistroFeedback.count === 1 ? "" : "s"} BNCC
              </strong>{" "}
              registrada
              {bnccRegistroFeedback.count === 1 ? "" : "s"} no Progresso BNCC
              deste material.
            </div>
          ) : null}

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
              {showFastDraftBanner ? (
                <aside className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
                  <p className="font-black">Rascunho rápido</p>
                  <p className="mt-1 font-semibold leading-6">
                    Gerado no modo rápido para você revisar em segundos. Antes de exportar
                    para a turma, use &quot;Elevar qualidade&quot; se o score estiver abaixo de{" "}
                    {UNIFIED_ELEVATE_BANNER_THRESHOLD}.
                  </p>
                </aside>
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
              {(canRetrySlideImages || canRetryExamQuestions) ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {canRetrySlideImages ? (
                    <button
                      type="button"
                      onClick={() => void regenerarImagensSlides()}
                      disabled={loading || retryingImages || retryingExam}
                      className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black text-violet-900 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {retryingImages ? "Resolvendo imagens…" : "Resolver imagens pendentes"}
                    </button>
                  ) : null}
                  {canRetryExamQuestions ? (
                    <button
                      type="button"
                      onClick={() => void regenerarQuestoesFracas()}
                      disabled={loading || retryingExam || retryingImages}
                      className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {retryingExam ? "Corrigindo questões…" : "Corrigir questões fracas"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {(pipelineGeracao || alertasGeracao.length > 0) && (
                <div className="mb-4 space-y-3">
                  {pipelineGeracao ? (
                    <p className="text-xs font-bold text-slate-500">
                      Origem:{" "}
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-cyan-800">
                        {pipelineDisplayLabel}
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
              {tipo === "slides" && studioMode ? (
                <aside className="mb-4 rounded-xl border border-violet-200/80 bg-violet-50/60 p-4">
                  <p className="text-sm font-black text-violet-900">
                    Complete sua aula
                  </p>
                  <p className="mt-1 text-xs font-semibold text-violet-800/90">
                    Mesmo tema — abra a próxima ferramenta do pacote:
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lessonBundleFollowUp.map((item) => (
                      <button
                        key={item.toolId}
                        type="button"
                        onClick={() => abrirFerramentaRelacionada(item.toolId)}
                        className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-900 transition hover:border-violet-400 hover:bg-violet-100"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </aside>
              ) : null}
              {tipo === "slides" ? (
                <SlideAiAdjustPanel
                  generationPayload={slideAdjustPayload}
                  disabled={loading || adjustingSlides}
                  onAdjusting={setAdjustingSlides}
                  onResult={handleSlideAiAdjustResult}
                  onError={setErro}
                />
              ) : null}
              {tipo === "slides" && !useStudioExportDock ? (
                <aside className="mb-4 rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-50/80 to-emerald-50/60 px-4 py-3">
                  <p className="text-sm font-bold text-cyan-900">
                    Abrir no Google Apresentações
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-cyan-800/90">
                    O Planify converte seus slides (com imagens e sequência pedagógica) em
                    apresentação nativa na sua conta Google.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <GoogleSlidesExportButton
                      title={buildTitle(tipo, tema)}
                      html={resultadoHtml}
                      slides={resultadoEstrutura?.slides}
                      theme={resultadoEstrutura?.slideTheme || designSlides}
                      returnTo="/dashboard?tipo=slides"
                      alwaysShowExport
                      iconOnly={false}
                    />
                    <SlidesPptxDownloadButton
                      title={buildTitle(tipo, tema)}
                      html={resultadoHtml}
                      slides={resultadoEstrutura?.slides}
                      theme={resultadoEstrutura?.slideTheme || designSlides}
                      documentType="material:slides"
                      iconOnly={false}
                      label="Baixar PPTX"
                    />
                  </div>
                </aside>
              ) : null}
              {!useStudioExportDock ? (
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
                  title={buildTitle(tipo, tema)}
                  getHtml={() => resultadoHtml}
                  tipoMaterial={mode.title}
                  tema={tema}
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
                  title={buildTitle(tipo, tema)}
                  getHtml={() => resultadoHtml}
                  documentType={`material:${tipo}`}
                  isSlideDeck={tipo === "slides"}
                  returnTo="/dashboard"
                  compact
                  classroomMode="popover"
                  disabled={!resultadoHtml}
                />
                <Link
                  href="/historico"
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <PlanifyIcon name="history" className="h-4 w-4" />
                  Histórico
                </Link>
              </div>
              ) : null}
              <MaterialTypedPreview html={resultadoHtml} tipoMaterial={tipo} />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-8 text-center">
              <PlanifyOwlMark size={72} glow />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Pré-visualização
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">
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
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Escolha uma ferramenta e gere o material em segundos.
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
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
                <h3 className="mt-4 text-sm font-extrabold leading-tight text-slate-950">
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
                <h2 className="text-lg font-extrabold tracking-tight text-slate-950">
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
