"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  getQuestionBankComponenteOptions,
  getQuestionBankYearOptions,
  normalizeQuestionBankFilterEducation,
  QUESTION_BANK_ETAPA_OPTIONS,
} from "@/lib/banco-questoes/question-bank-education";
import {
  isQuestionBankFilterActive,
  isQuestionBankSearchActive,
  searchQuestionBankItems,
} from "@/lib/banco-questoes/question-bank-match";
import {
  getQuestionBankCollection,
  getQuestionReviewLabel,
  isCuratedQuestion,
  isHumanReviewedQuestion,
} from "@/lib/banco-questoes/question-bank-curation";
import { CURATED_QUESTION_BANK_ITEMS } from "@/lib/banco-questoes/question-bank-curated-catalog";
import { splitEmbeddedReadingText } from "@/lib/banco-questoes/question-bank-self-contained";
import { extractQuestionsFromMaterialOutput } from "@/lib/banco-questoes/question-bank-extract";
import {
  deleteQuestionHybrid,
  incrementQuestionUsage,
  publishQuestionToCommunity,
  publishQuestionToSchool,
  syncFromServerOnMount,
  upsertQuestionHybrid,
  upsertQuestionToServerNow,
} from "@/lib/banco-questoes/question-bank-sync";
import { formatGenerationError, GenerationErrorBanner } from "@/lib/pro/generation-error-ui";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import {
  importQuestionsFromServer,
  listImportableSources,
  type ImportableQuestionSource,
} from "@/lib/banco-questoes/question-bank-import-client";
import { fetchMaterialEstrutura } from "@/lib/materiais/material-estrutura-client";
import { loadHistoryItems } from "@/lib/history/history-storage";
import { requestExamAssemblyFromBank } from "@/lib/materiais/exam-bank-montar-client";
import { openMaterialInEditor } from "@/lib/materiais/material-editor-flow";
import {
  renderGabaritoTable,
  renderQuestionCard,
  wrapProfessionalDocument,
} from "@/lib/materiais/material-document-layout";
import { dashboardToolHref } from "@/lib/pro/toolRoutes";
import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import {
  DEFAULT_QUESTION_BANK_FILTER,
  type QuestionBankFilter,
  type QuestionBankItem,
  type QuestionBankSource,
} from "@/types/question-bank";
import { useRouter } from "next/navigation";
import {
  HUD_FIELD_CLASS,
  HUD_FILTER_CHIP_ACTIVE,
  HUD_FILTER_CHIP_INACTIVE,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";

const SOURCE_OPTIONS: {
  id: QuestionBankSource;
  label: string;
  hint: string;
}[] = [
  { id: "todas", label: "Todo o acervo", hint: "Suas questões, comunidade e escola" },
  { id: "minhas", label: "Criadas por mim", hint: "Questões importadas ou remixadas por você" },
  { id: "comunidade", label: "Comunidade Planify", hint: "Questões públicas de outros professores" },
  { id: "escola", label: "Da minha escola", hint: "Questões compartilhadas na sua escola" },
  { id: "curadas", label: "Curadas", hint: "Fontes humanas revisadas e robô Planify" },
];

const QUICK_CATALOGS: Array<{
  etapa: QuestionBankFilter["etapa"];
  label: string;
  description: string;
}> = [
  { etapa: "todos", label: "Todo o acervo", description: "Explore sem recorte" },
  { etapa: "Ensino Fundamental", label: "Fundamental", description: "Anos iniciais e finais" },
  { etapa: "Ensino Médio", label: "Ensino Médio", description: "Formação geral" },
  { etapa: "ENEM e Vestibulares", label: "ENEM e vestibulares", description: "Alta complexidade" },
  { etapa: "Concursos Públicos", label: "Concursos", description: "Conhecimentos específicos" },
  { etapa: "Ensino Superior", label: "Superior", description: "Graduação e formação" },
];

type QuestionBankCurationSummary = {
  totalPublic: number;
  curated: number;
  humanReviewed: number;
  automated: number;
  latestAt: string | null;
  byCollection: Record<string, number>;
};

function newId(): string {
  return `qb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalOnlyQuestionId(id: string): boolean {
  return id.startsWith("qb-") || id.startsWith("curated-planify-");
}

function buildAvaliacaoTitle(tipo: "prova" | "lista", tema: string): string {
  const label = tipo === "lista" ? "Lista" : "Prova";
  return `${label} — ${tema.trim() || "Material Planify"}`;
}

function getSafeExternalUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function resolveQuestionDisplay(item: QuestionBankItem): {
  enunciado: string;
  textoApoio?: string;
} {
  if (item.textoApoio?.trim()) {
    return { enunciado: item.enunciado, textoApoio: item.textoApoio.trim() };
  }
  const split = splitEmbeddedReadingText(item.enunciado);
  return {
    enunciado: split.enunciado,
    textoApoio: split.textoApoio,
  };
}

function buildQuestionBankMaterialHtml(
  selected: QuestionBankItem[],
  payload: MaterialEngineInput,
  tipoMaterial: "prova" | "lista",
): string {
  const title = buildAvaliacaoTitle(tipoMaterial, String(payload.tema || ""));
  const itemLabel = tipoMaterial === "lista" ? "Exercício" : "Questão";
  const questions = selected
    .map((item, index) => {
      const display = resolveQuestionDisplay(item);
      const statement = display.textoApoio?.trim()
        ? `Texto para leitura:\n${display.textoApoio.trim()}\n\n${display.enunciado}`
        : display.enunciado;

      return renderQuestionCard({
        number: index + 1,
        statement,
        options: item.alternativas,
        questionType: item.tipo,
        label: itemLabel,
        compact: true,
      });
    })
    .join("");
  const gabarito = renderGabaritoTable(
    selected.map((item, index) => {
      const answer =
        item.respostaEsperada ||
        item.criterioCorrecao ||
        "Resposta a critério do professor.";
      return { number: index + 1, answer };
    }),
  );

  return wrapProfessionalDocument(
    {
      title,
      subtitle: [payload.componente, payload.anoSerie].filter(Boolean).join(" · "),
      summary: "",
      tipo: tipoMaterial,
      tema: String(payload.tema || ""),
      request: {
        tipoMaterial,
        tema: String(payload.tema || ""),
        componenteCurricular: String(payload.componente || ""),
        anoSerie: String(payload.anoSerie || ""),
        etapa: String(payload.etapa || ""),
      },
    },
    `<section class="planify-questoes-block planify-questoes-block-direct">${questions}</section>${gabarito}`,
  );
}

function buildQuestionBankMaterialOutput(
  selected: QuestionBankItem[],
  payload: MaterialEngineInput,
  tipoMaterial: "prova" | "lista",
): MaterialAIOutput {
  const tema = String(payload.tema || "Avaliação do banco");
  return {
    titulo: buildAvaliacaoTitle(tipoMaterial, tema),
    subtitulo: [payload.componente, payload.anoSerie].filter(Boolean).join(" · "),
    tipo: tipoMaterial,
    resumo: `Material montado com ${selected.length} questão(ões) do banco Planify.`,
    dadosGerais: {
      etapa: String(payload.etapa || ""),
      anoSerie: String(payload.anoSerie || ""),
      componenteCurricular: String(payload.componente || ""),
      tema,
    },
    objetivos: [`Avaliar aprendizagens relacionadas a ${tema}.`],
    conteudos: [tema],
    orientacoesProfessor: [
      "Revise os enunciados, ajuste a pontuação e adapte o tempo de aplicação à turma.",
    ],
    orientacoesAluno: ["Leia cada questão com atenção antes de responder."],
    introducao: "",
    secoes: [],
    questoes: selected.map((item, index) => ({
      numero: index + 1,
      tipo: item.tipo,
      enunciado: resolveQuestionDisplay(item).enunciado,
      alternativas: item.alternativas,
      respostaEsperada: item.respostaEsperada,
      criterioCorrecao: item.criterioCorrecao,
    })),
    criteriosAvaliacao: [
      "Correção conceitual das respostas.",
      "Justificativa coerente quando solicitada.",
    ],
    gabarito: selected.map(
      (item, index) =>
        `${index + 1}. ${
          item.respostaEsperada ||
          item.criterioCorrecao ||
          "Resposta a critério do professor."
        }`,
    ),
    adaptacoesInclusivas: [],
    sugestoesUso: ["Aplicar como avaliação diagnóstica, formativa ou revisão dirigida."],
    alertas: [],
  };
}

type RemixDraft = {
  enunciado: string;
  tipo: string;
  alternativas: string;
  respostaEsperada: string;
};

type AppliedQuestionBankSearch = Pick<
  QuestionBankFilter,
  "query" | "bncc" | "bnccCodigos" | "bnccSearchTerms"
>;

const EMPTY_APPLIED_SEARCH: AppliedQuestionBankSearch = {
  query: "",
  bncc: "",
  bnccCodigos: undefined,
  bnccSearchTerms: undefined,
};

type EmbeddedBankStep = "setup" | "browse";
type EmbeddedQuestionBankTab = "draft" | "bank";
type EmbeddedQuestionKind = "objetiva" | "discursiva";
type EmbeddedDifficulty = "Muito facil" | "Facil" | "Medio" | "Dificil" | "Muito dificil";

const EMBEDDED_BANK_PAGE_SIZE = 20;
const EMBEDDED_DIFFICULTY_OPTIONS: EmbeddedDifficulty[] = [
  "Muito facil",
  "Facil",
  "Medio",
  "Dificil",
  "Muito dificil",
];
const DEFAULT_KIND_FILTERS: Record<EmbeddedQuestionKind, boolean> = {
  objetiva: true,
  discursiva: true,
};
const DEFAULT_DIFFICULTY_FILTERS: Record<EmbeddedDifficulty, boolean> = {
  "Muito facil": true,
  Facil: true,
  Medio: true,
  Dificil: true,
  "Muito dificil": true,
};
const ALTERNATIVE_LABELS = ["A", "B", "C", "D", "E", "F"];

function normalizeTextForQuestionBank(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getEmbeddedQuestionKind(item: QuestionBankItem): EmbeddedQuestionKind {
  const tipo = normalizeTextForQuestionBank(item.tipo || "");
  if (tipo.includes("objet") || item.alternativas.length >= 2) return "objetiva";
  return "discursiva";
}

function getEmbeddedQuestionDifficulty(item: QuestionBankItem): EmbeddedDifficulty {
  const searchable = normalizeTextForQuestionBank(
    [item.tipo, item.tema, item.sourceTitle, ...item.tags].filter(Boolean).join(" "),
  );

  if (searchable.includes("muito dificil") || searchable.includes("avancad")) {
    return "Muito dificil";
  }
  if (searchable.includes("dificil") || getQuestionBankCollection(item) === "concurso") {
    return "Dificil";
  }
  if (searchable.includes("muito facil")) return "Muito facil";
  if (searchable.includes("facil")) return "Facil";
  return "Medio";
}

function getEmbeddedDifficultyLabel(value: EmbeddedDifficulty): string {
  switch (value) {
    case "Muito facil":
      return "Muito fácil";
    case "Facil":
      return "Fácil";
    case "Medio":
      return "Médio";
    case "Dificil":
      return "Difícil";
    case "Muito dificil":
      return "Muito difícil";
    default:
      return value;
  }
}

function getEmbeddedQuestionSourceLabel(item: QuestionBankItem): string {
  if (item.isSchool) return "Escola";
  if (item.isCommunity) return item.authorName ? "Professor" : "Comunidade";
  if (isCuratedQuestion(item)) return "Planify AI";
  return "Meu banco";
}

function getEmbeddedQuestionYear(item: QuestionBankItem): string {
  const year = new Date(item.createdAt).getFullYear();
  return Number.isFinite(year) ? String(year) : "Banco";
}

function isExpectedAlternative(item: QuestionBankItem, alternative: string, index: number): boolean {
  const expected = normalizeTextForQuestionBank(item.respostaEsperada.trim());
  if (!expected) return false;

  const label = (ALTERNATIVE_LABELS[index] || String(index + 1)).toLowerCase();
  const normalizedAlternative = normalizeTextForQuestionBank(alternative.trim());

  return (
    expected === label ||
    expected.startsWith(`${label}.`) ||
    expected.startsWith(`${label})`) ||
    expected.includes(`alternativa ${label}`) ||
    expected.includes(`opcao ${label}`) ||
    expected === normalizedAlternative
  );
}

type BancoQuestoesClientProps = {
  /** Exibe o acervo dentro da criação de uma prova ou lista. */
  embedded?: boolean;
  /** Restringe a montagem ao tipo de avaliação em edição. */
  targetMaterial?: "prova" | "lista";
  onBack?: () => void;
};

export function BancoQuestoesClient({
  embedded = false,
  targetMaterial,
  onBack,
}: BancoQuestoesClientProps = {}) {
  const router = useRouter();
  const school = useSchoolClasses();
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [communityItems, setCommunityItems] = useState<QuestionBankItem[]>([]);
  const [schoolItems, setSchoolItems] = useState<QuestionBankItem[]>([]);
  const [syncing, setSyncing] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<QuestionBankFilter>(DEFAULT_QUESTION_BANK_FILTER);
  const [draftQuery, setDraftQuery] = useState("");
  const [manualBncc, setManualBncc] = useState("");
  const [appliedSearch, setAppliedSearch] =
    useState<AppliedQuestionBankSearch>(EMPTY_APPLIED_SEARCH);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [importError, setImportError] = useState("");
  const [importRetryable, setImportRetryable] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [serverSources, setServerSources] = useState<ImportableQuestionSource[]>([]);
  const [serverSelectedIds, setServerSelectedIds] = useState<Set<string>>(new Set());
  const [serverLoading, setServerLoading] = useState(false);
  const [serverImporting, setServerImporting] = useState(false);
  const [remixSource, setRemixSource] = useState<QuestionBankItem | null>(null);
  const [remixDraft, setRemixDraft] = useState<RemixDraft | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);
  const [curationSummary, setCurationSummary] =
    useState<QuestionBankCurationSummary | null>(null);
  const [embeddedBankStep, setEmbeddedBankStep] = useState<EmbeddedBankStep>(
    embedded ? "setup" : "browse",
  );
  const [embeddedActiveTab, setEmbeddedActiveTab] =
    useState<EmbeddedQuestionBankTab>("bank");
  const [embeddedTypeFilters, setEmbeddedTypeFilters] =
    useState<Record<EmbeddedQuestionKind, boolean>>(DEFAULT_KIND_FILTERS);
  const [embeddedDifficultyFilters, setEmbeddedDifficultyFilters] =
    useState<Record<EmbeddedDifficulty, boolean>>(DEFAULT_DIFFICULTY_FILTERS);
  const [embeddedBankPage, setEmbeddedBankPage] = useState(1);

  useEffect(() => {
    void syncFromServerOnMount()
      .then((all) => {
        setItems(all.filter((item) => !item.isCommunity && !item.isSchool));
        setCommunityItems(all.filter((item) => item.isCommunity));
        setSchoolItems(all.filter((item) => item.isSchool));
      })
      .catch(() => {
        /* offline — local only */
      })
      .finally(() => setSyncing(false));
  }, []);

  useEffect(() => {
    void planifyAuthenticatedFetch("/api/banco-questoes/curadoria", { method: "GET" })
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (data?.ok && data.summary) {
          setCurationSummary(data.summary as QuestionBankCurationSummary);
        }
      })
      .catch(() => {
        /* O acervo continua utilizável se o resumo de curadoria estiver indisponível. */
      });
  }, []);

  const allItems = useMemo(() => {
    const byId = new Map<string, QuestionBankItem>();
    for (const item of [
      ...CURATED_QUESTION_BANK_ITEMS,
      ...items,
      ...communityItems,
      ...schoolItems,
    ]) {
      byId.set(item.id, item);
    }
    return Array.from(byId.values());
  }, [communityItems, items, schoolItems]);

  const sourceOptions = useMemo(
    () =>
      school.hasSchool
        ? SOURCE_OPTIONS
        : SOURCE_OPTIONS.filter((option) => option.id !== "escola"),
    [school.hasSchool],
  );

  const yearOptions = useMemo(
    () => getQuestionBankYearOptions(filter.etapa),
    [filter.etapa],
  );

  const componenteOptions = useMemo(
    () => getQuestionBankComponenteOptions(filter.etapa),
    [filter.etapa],
  );

  const effectiveFilter = useMemo(
    (): QuestionBankFilter => ({
      ...filter,
      ...appliedSearch,
    }),
    [appliedSearch, filter],
  );

  const searchResult = useMemo(() => {
    return searchQuestionBankItems(allItems, effectiveFilter);
  }, [allItems, effectiveFilter]);

  const filtered = searchResult.items;
  const relatedItems = searchResult.related;
  const searchMode = searchResult.mode;
  const searchActive = isQuestionBankSearchActive(effectiveFilter);
  const filterActive = isQuestionBankFilterActive(effectiveFilter);
  const searchPending =
    draftQuery.trim() !== appliedSearch.query.trim() ||
    manualBncc.trim() !== appliedSearch.bncc.trim();

  function patchFilter(patch: Partial<QuestionBankFilter>) {
    setFilter((current) => {
      const next = { ...current, ...patch };
      const education = normalizeQuestionBankFilterEducation(current, patch);
      return { ...next, ...education };
    });
  }

  const selectedItems = useMemo(() => {
    const byId = new Map(allItems.map((item) => [item.id, item]));
    return Array.from(selectedIds)
      .map((id) => byId.get(id))
      .filter((item): item is QuestionBankItem => Boolean(item));
  }, [allItems, selectedIds]);

  const inventory = useMemo(() => {
    const humanReviewed = allItems.filter((item) => isHumanReviewedQuestion(item)).length;
    const curated = allItems.filter((item) => isCuratedQuestion(item)).length;
    return {
      total: allItems.length,
      curated,
      humanReviewed,
      advanced: allItems.filter((item) => {
        const collection = getQuestionBankCollection(item);
        return collection === "enem" || collection === "vestibular" || collection === "concurso" || collection === "superior";
      }).length,
    };
  }, [allItems]);

  const visibleItems = useMemo(
    () => [...filtered, ...relatedItems],
    [filtered, relatedItems],
  );

  const embeddedBankItems = useMemo(() => {
    return visibleItems.filter((item) => {
      const kind = getEmbeddedQuestionKind(item);
      const difficulty = getEmbeddedQuestionDifficulty(item);
      return embeddedTypeFilters[kind] && embeddedDifficultyFilters[difficulty];
    });
  }, [embeddedDifficultyFilters, embeddedTypeFilters, visibleItems]);

  const embeddedBankTotalPages = Math.max(
    1,
    Math.ceil(embeddedBankItems.length / EMBEDDED_BANK_PAGE_SIZE),
  );
  const embeddedSafePage = Math.min(embeddedBankPage, embeddedBankTotalPages);
  const embeddedPagedItems = useMemo(() => {
    const start = (embeddedSafePage - 1) * EMBEDDED_BANK_PAGE_SIZE;
    return embeddedBankItems.slice(start, start + EMBEDDED_BANK_PAGE_SIZE);
  }, [embeddedBankItems, embeddedSafePage]);
  const embeddedPageStart =
    embeddedBankItems.length === 0 ? 0 : (embeddedSafePage - 1) * EMBEDDED_BANK_PAGE_SIZE + 1;
  const embeddedPageEnd = Math.min(
    embeddedSafePage * EMBEDDED_BANK_PAGE_SIZE,
    embeddedBankItems.length,
  );
  const embeddedPageNumbers = useMemo(() => {
    const pages = new Set<number>([1, embeddedBankTotalPages]);
    for (let page = embeddedSafePage - 1; page <= embeddedSafePage + 1; page += 1) {
      if (page >= 1 && page <= embeddedBankTotalPages) pages.add(page);
    }
    return Array.from(pages).sort((a, b) => a - b);
  }, [embeddedBankTotalPages, embeddedSafePage]);

  useEffect(() => {
    setEmbeddedBankPage(1);
  }, [effectiveFilter, embeddedDifficultyFilters, embeddedTypeFilters]);

  useEffect(() => {
    if (embeddedBankPage > embeddedBankTotalPages) {
      setEmbeddedBankPage(embeddedBankTotalPages);
    }
  }, [embeddedBankPage, embeddedBankTotalPages]);

  const bnccSupportedStage =
    filter.etapa === "Ensino Fundamental" || filter.etapa === "Ensino Médio";
  function runQuestionBankSearch() {
    if (!draftQuery.trim() && !manualBncc.trim()) {
      setAppliedSearch(EMPTY_APPLIED_SEARCH);
      return;
    }

    setAppliedSearch({
      query: draftQuery.trim(),
      bncc: manualBncc.trim(),
      bnccCodigos: undefined,
      bnccSearchTerms: undefined,
    });
  }

  function startEmbeddedBankSearch() {
    setImportError("");
    setImportStatus("");
    runQuestionBankSearch();
    setEmbeddedBankStep("browse");
    setEmbeddedActiveTab("bank");
    setEmbeddedBankPage(1);
  }

  function openBlankMaterial() {
    router.push(dashboardToolHref(targetMaterial ?? "prova"));
  }

  function toggleEmbeddedTypeFilter(kind: EmbeddedQuestionKind) {
    setEmbeddedTypeFilters((current) => {
      if (current[kind] && Object.values(current).filter(Boolean).length === 1) {
        return current;
      }
      return { ...current, [kind]: !current[kind] };
    });
  }

  function toggleEmbeddedDifficultyFilter(difficulty: EmbeddedDifficulty) {
    setEmbeddedDifficultyFilters((current) => {
      if (current[difficulty] && Object.values(current).filter(Boolean).length === 1) {
        return current;
      }
      return { ...current, [difficulty]: !current[difficulty] };
    });
  }

  function clearAppliedSearch() {
    setAppliedSearch(EMPTY_APPLIED_SEARCH);
    setDraftQuery("");
    setManualBncc("");
  }

  function resetFilters() {
    setFilter(DEFAULT_QUESTION_BANK_FILTER);
    clearAppliedSearch();
    setSelectedIds(new Set());
    setShowAdvanced(false);
  }

  function applyQuickCatalog(etapa: QuestionBankFilter["etapa"]) {
    patchFilter({
      etapa,
      anoSerie: "todos",
      componente: "todos",
    });
    clearAppliedSearch();
  }

  function refreshFromHybrid() {
    void syncFromServerOnMount().then((all) => {
      setItems(all.filter((item) => !item.isCommunity && !item.isSchool));
      setCommunityItems(all.filter((item) => item.isCommunity));
      setSchoolItems(all.filter((item) => item.isSchool));
    });
  }

  function applyImportError(error: unknown) {
    const formatted = formatGenerationError(error);
    setImportError(formatted.message);
    setImportRetryable(formatted.retryable);
    setImportStatus("");
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeSelectedItem(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function moveSelectedItem(id: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const ids = Array.from(current);
      const index = ids.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ids.length) return current;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return new Set(ids);
    });
  }

  function upsertWithFeedback(item: QuestionBankItem, message?: string) {
    const { items: next, duplicate } = upsertQuestionHybrid(item);
    setItems(next);
    if (duplicate) {
      setImportStatus("Questão já estava no banco.");
    } else if (message) {
      setImportStatus(message);
    }
    return !duplicate;
  }

  async function importFromHistory() {
    const history = loadHistoryItems();
    const questionTypes = new Set(["prova", "lista", "atividade", "redacao"]);
    let imported = 0;
    let duplicates = 0;
    let fromServerFallback = 0;
    let legacyWithoutId = 0;

    for (const entry of history) {
      const normalizedType = entry.type.replace(/^material:/, "");
      if (!questionTypes.has(entry.type) && !questionTypes.has(normalizedType)) {
        continue;
      }

      const raw = entry.raw as
        | {
            estrutura?: MaterialAIOutput;
            serverMaterialId?: string;
            toolId?: string;
            componente?: string;
            anoSerie?: string;
            tema?: string;
          }
        | MaterialAIOutput
        | undefined;

      let estrutura =
        raw && typeof raw === "object" && "estrutura" in raw
          ? (raw as { estrutura?: MaterialAIOutput }).estrutura
          : raw && typeof raw === "object" && "questoes" in raw
            ? (raw as MaterialAIOutput)
            : undefined;

      let usedServerFallback = false;
      let bnccCodigos: string[] | undefined;

      if (!estrutura?.questoes?.length) {
        const serverMaterialId =
          raw && typeof raw === "object" && "serverMaterialId" in raw
            ? String((raw as { serverMaterialId?: string }).serverMaterialId || "").trim()
            : "";

        if (serverMaterialId) {
          const remote = await fetchMaterialEstrutura(serverMaterialId);
          if (remote?.estrutura?.questoes?.length) {
            estrutura = remote.estrutura;
            usedServerFallback = true;
            bnccCodigos = remote.meta.bncc_skill_codes;
          }
        } else {
          legacyWithoutId += 1;
        }
      }

      if (!estrutura?.questoes?.length) continue;

      const extracted = extractQuestionsFromMaterialOutput(estrutura, {
        componente:
          raw && typeof raw === "object" && "componente" in raw
            ? String((raw as { componente?: string }).componente || "")
            : undefined,
        anoSerie:
          raw && typeof raw === "object" && "anoSerie" in raw
            ? String((raw as { anoSerie?: string }).anoSerie || "")
            : undefined,
        tema:
          raw && typeof raw === "object" && "tema" in raw
            ? String((raw as { tema?: string }).tema || "")
            : entry.subtitle || entry.title,
        sourceTitle: entry.title,
        sourceType: normalizedType || entry.type,
        bnccCodigos,
      });

      const now = new Date().toISOString();
      for (const question of extracted) {
        const saved = upsertWithFeedback({
          ...question,
          id: newId(),
          createdAt: now,
          updatedAt: now,
        });
        if (saved) imported += 1;
        else duplicates += 1;
        if (usedServerFallback) fromServerFallback += 1;
      }
    }

    if (imported > 0 || duplicates > 0) {
      const parts = [];
      if (imported > 0) parts.push(`${imported} nova(s)`);
      if (duplicates > 0) parts.push(`${duplicates} duplicata(s)`);
      setImportStatus(`Histórico: ${parts.join(", ")}.`);
    } else if (legacyWithoutId > 0) {
      setImportStatus(
        "Materiais antigos sem estrutura local: use Importar do servidor.",
      );
    } else {
      setImportStatus(
        "Nenhuma questão encontrada em provas/listas do histórico.",
      );
    }
  }

  async function openServerImportModal() {
    setServerModalOpen(true);
    setServerLoading(true);
    setServerSelectedIds(new Set());
    try {
      const fontes = await listImportableSources({
        tipos: ["prova", "lista", "atividade", "redacao"],
        limit: 50,
      });
      setServerSources(fontes);
    } catch {
      setServerSources([]);
      setImportStatus("Não foi possível carregar materiais do servidor.");
    } finally {
      setServerLoading(false);
    }
  }

  function toggleServerSource(id: string) {
    setServerSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function importFromServer() {
    const ids = Array.from(serverSelectedIds);
    if (!ids.length) {
      setImportStatus("Selecione ao menos um material do servidor.");
      return;
    }

    setServerImporting(true);
    try {
      const result = await importQuestionsFromServer(ids);
      let imported = 0;
      let duplicates = 0;

      for (const item of result.items) {
        const saved = upsertWithFeedback(item);
        if (saved) imported += 1;
        else duplicates += 1;
      }

      refreshFromHybrid();
      setImportStatus(
        imported > 0 || duplicates > 0
          ? `${imported} importada(s), ${duplicates} duplicata(s) ignorada(s).`
          : "Nenhuma questão encontrada nos materiais selecionados.",
      );
      setServerModalOpen(false);
    } catch (error) {
      applyImportError(error);
    } finally {
      setServerImporting(false);
    }
  }

  function openRemixModal(item: QuestionBankItem) {
    setRemixSource(item);
    setRemixDraft({
      enunciado: item.enunciado,
      tipo: item.tipo,
      alternativas: item.alternativas.join("\n"),
      respostaEsperada: item.respostaEsperada,
    });
  }

  function saveRemix() {
    if (!remixSource || !remixDraft) return;

    const now = new Date().toISOString();
    const copy: QuestionBankItem = {
      ...remixSource,
      id: newId(),
      enunciado: remixDraft.enunciado.trim(),
      tipo: remixDraft.tipo.trim() || "discursiva",
      alternativas: remixDraft.alternativas
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      respostaEsperada: remixDraft.respostaEsperada.trim(),
      isCommunity: false,
      sourceTitle: `Remix — ${remixSource.sourceTitle || remixSource.tema}`,
      tags: [...remixSource.tags.filter((t) => t !== "remix"), "remix"],
      createdAt: now,
      updatedAt: now,
      contentHash: undefined,
    };

    upsertWithFeedback(copy, "Remix salvo no banco.");
    setRemixSource(null);
    setRemixDraft(null);
  }

  async function publicarNaComunidade(item: QuestionBankItem) {
    if (item.isCommunity) return;
    const confirmed = window.confirm(
      "Publicar na comunidade? A questão ficará visível para outros professores.",
    );
    if (!confirmed) return;

    setPublishingId(item.id);
    try {
      const { item: saved } = await upsertQuestionToServerNow(item);
      upsertQuestionHybrid(saved);

      await publishQuestionToCommunity(saved.id);
      refreshFromHybrid();
      setImportStatus("Questão publicada na comunidade.");
    } catch (error) {
      applyImportError(error);
    } finally {
      setPublishingId(null);
    }
  }

  async function compartilharComEscola(item: QuestionBankItem) {
    if (item.isSchool || item.isCommunity) return;
    const confirmed = window.confirm(
      "Compartilhar com a escola? Colegas da mesma escola poderão ver esta questão.",
    );
    if (!confirmed) return;

    setPublishingId(item.id);
    setImportError("");
    try {
      const { item: saved } = await upsertQuestionToServerNow(item);
      await publishQuestionToSchool(saved.id, school.schoolId ?? undefined);
      refreshFromHybrid();
      setImportStatus("Questão compartilhada com a escola.");
    } catch (error) {
      applyImportError(error);
    } finally {
      setPublishingId(null);
    }
  }

  function selectAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const item of visibleItems) next.add(item.id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function buildMontarPayload(
    selected: QuestionBankItem[],
    tipoMaterial: "prova" | "lista",
  ): MaterialEngineInput {
    const tema =
      effectiveFilter.query.trim() ||
      draftQuery.trim() ||
      selected[0]?.tema.trim() ||
      "Avaliação do banco";
    const componente =
      filter.componente !== "todos"
        ? filter.componente
        : selected[0]?.componente || "Multicomponente";
    const anoSerie =
      filter.anoSerie !== "todos"
        ? filter.anoSerie
        : selected[0]?.anoSerie || "Geral";
    const etapa =
      filter.etapa !== "todos"
        ? filter.etapa
        : selected[0]?.etapa || "Ensino Fundamental";

    return {
      tipoMaterial,
      tipo: tipoMaterial,
      tema,
      temaCentral: tema,
      componente,
      componenteCurricular: componente,
      disciplina: componente,
      discipline: componente,
      anoSerie,
      etapa,
      quantidade: selected.length,
      incluirGabarito: true,
    };
  }

  const embeddedDraftPayload = useMemo(() => {
    if (!selectedItems.length) return null;
    return buildMontarPayload(selectedItems, targetMaterial ?? "prova");
  }, [
    draftQuery,
    effectiveFilter.query,
    filter.anoSerie,
    filter.componente,
    filter.etapa,
    selectedItems,
    targetMaterial,
  ]);

  const embeddedDraftHtml = useMemo(() => {
    if (!embeddedDraftPayload || !selectedItems.length) return "";
    return buildQuestionBankMaterialHtml(
      selectedItems,
      embeddedDraftPayload,
      targetMaterial ?? "prova",
    );
  }, [embeddedDraftPayload, selectedItems, targetMaterial]);

  async function montarAvaliacao(tipoMaterial: "prova" | "lista") {
    const selected = selectedItems;
    if (!selected.length) {
      setImportStatus("Selecione ao menos uma questão (botão Selecionar em cada card).");
      return;
    }

    setAssembling(true);
    setImportError("");
    setImportStatus("");

    try {
      const payload = buildMontarPayload(selected, tipoMaterial);
      const questionIds = selected.map((item) => item.id);
      const allServerIds = questionIds.every((id) => !isLocalOnlyQuestionId(id));

      if (allServerIds) {
        const result = await requestExamAssemblyFromBank(payload, questionIds);
        const titulo = buildAvaliacaoTitle(tipoMaterial, payload.tema || "");
        openMaterialInEditor(
          result.html,
          titulo,
          {
            toolId: tipoMaterial,
            tema: payload.tema || "",
            componente: payload.componente || "",
            anoSerie: payload.anoSerie || "",
            etapa: payload.etapa,
            pipeline: result.pipeline,
            qualityScore: result.qualityScore,
            qualityIssues: result.qualityIssues,
            estrutura: result.estrutura,
            serverMaterialId: result.materialId ?? undefined,
            generationPayload: payload,
          },
          { from: "banco-questoes" },
        );
        setImportStatus(
          `${selected.length} questão(ões) geradas — editor aberto.`,
        );
        return;
      }

      for (const item of selected) {
        if (!isLocalOnlyQuestionId(item.id)) {
          void incrementQuestionUsage(item.id);
        }
      }
      const titulo = buildAvaliacaoTitle(tipoMaterial, payload.tema || "");
      const estrutura = buildQuestionBankMaterialOutput(selected, payload, tipoMaterial);
      openMaterialInEditor(
        buildQuestionBankMaterialHtml(selected, payload, tipoMaterial),
        titulo,
        {
          toolId: tipoMaterial,
          tema: payload.tema || "",
          componente: payload.componente || "",
          anoSerie: payload.anoSerie || "",
          etapa: payload.etapa,
          pipeline: "bank-selected-local",
          qualityScore: null,
          qualityIssues: [],
          estrutura,
          generationPayload: payload,
        },
        { from: "banco-questoes" },
      );
      setImportStatus(`${selected.length} questão(ões) geradas — editor aberto.`);
    } catch (error) {
      applyImportError(error);
    } finally {
      setAssembling(false);
    }
  }

  async function excluirItem(id: string) {
    if (communityItems.some((item) => item.id === id)) return;
    try {
      await deleteQuestionHybrid(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch {
      setImportStatus("Não foi possível excluir a questão.");
    }
  }

  const showCommunityEmpty =
    filter.source === "comunidade" && !syncing && filtered.length === 0;
  const targetLabel = targetMaterial === "lista" ? "lista" : "prova";
  const targetTitle = targetMaterial === "lista" ? "Lista" : "Prova";
  const showQuestionList = !embedded || searchMode === "search";
  const pageHeader = (
    <PlanifyPageHero
      title={
        embedded
          ? `Questões do banco para sua ${targetLabel}`
          : "Banco de questões"
      }
      description={
        embedded
          ? "Pesquise, selecione e monte sua avaliação sem sair desta ferramenta."
          : "Encontre, selecione e transforme questões em uma prova ou lista pronta para revisar."
      }
      icon="library"
    />
  );

  const embeddedSourceFilters: Array<{ source: QuestionBankSource; label: string }> = [
    { source: "todas", label: "Todos" },
    { source: "curadas", label: "Questões Planify" },
    { source: "comunidade", label: "Questões de professores" },
    ...(school.hasSchool ? [{ source: "escola" as QuestionBankSource, label: "Minha escola" }] : []),
  ];

  const embeddedBankContent = (
    <div className={`min-h-[74vh] bg-slate-50${selectedItems.length > 0 ? " pb-28" : ""}`}>
      {embeddedBankStep === "setup" ? (
        <div className="flex min-h-[74vh] flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <span />
            )}
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Fechar banco de questões"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <PlanifyIcon name="close" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <PlanifyIcon name="fileText" className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">{targetTitle}</h2>
                <p className="text-sm font-medium text-slate-500">
                  Gere uma {targetLabel} para avaliar seus alunos
                </p>
              </div>
            </div>

            <div className="mt-8 grid overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-2">
              <button
                type="button"
                onClick={onBack}
                className="flex min-h-16 flex-col items-center justify-center gap-1 border-b border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 sm:border-b-0 sm:border-r"
              >
                <span className="inline-flex items-center gap-2">
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                  {targetTitle} automática
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Comece com uma lista pronta e edite como quiser.
                </span>
              </button>
              <button
                type="button"
                className="flex min-h-16 flex-col items-center justify-center gap-1 border-b-2 border-blue-500 bg-blue-50 px-4 py-3 text-center text-sm font-black text-slate-900"
              >
                <span>Banco de questões</span>
                <span className="text-[11px] font-medium text-slate-500">
                  Crie selecionando manualmente as questões.
                </span>
              </button>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={HUD_SECTION_LABEL}>Nível</span>
                <select
                  value={filter.etapa}
                  onChange={(event) =>
                    patchFilter({
                      etapa: event.target.value as QuestionBankFilter["etapa"],
                      anoSerie: "todos",
                      componente: "todos",
                    })
                  }
                  className={HUD_FIELD_CLASS}
                >
                  {QUESTION_BANK_ETAPA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={HUD_SECTION_LABEL}>Ano escolar</span>
                <select
                  value={filter.anoSerie}
                  onChange={(event) => patchFilter({ anoSerie: event.target.value })}
                  className={HUD_FIELD_CLASS}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === "todos" ? "Todos" : year}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className={HUD_SECTION_LABEL}>Disciplina</span>
                <select
                  value={filter.componente}
                  onChange={(event) => patchFilter({ componente: event.target.value })}
                  className={HUD_FIELD_CLASS}
                >
                  {componenteOptions.map((component) => (
                    <option key={component} value={component}>
                      {component === "todos" ? "Todas" : component}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className={HUD_SECTION_LABEL}>Assunto</span>
                <input
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      startEmbeddedBankSearch();
                    }
                  }}
                  placeholder="Digite o assunto"
                  className={HUD_FIELD_CLASS}
                />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3">
              <button
                type="button"
                onClick={startEmbeddedBankSearch}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                Buscar questões
              </button>
              <button
                type="button"
                onClick={openBlankMaterial}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Ou criar uma {targetLabel} em branco
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-[74vh] bg-slate-50">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEmbeddedBankStep("setup")}
                  aria-label="Voltar para filtros iniciais"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
                >
                  <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-slate-950">
                    Lista do banco de questões
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    {selectedItems.length} na minha {targetLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label="Fechar banco de questões"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <PlanifyIcon name="close" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex overflow-x-auto border-t border-slate-100 px-4 sm:px-6">
              <button
                type="button"
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${
                  embeddedActiveTab === "draft"
                    ? "border-blue-500 bg-blue-50 font-black text-slate-950"
                    : "border-transparent font-bold text-slate-600 hover:text-slate-900"
                }`}
                onClick={() => setEmbeddedActiveTab("draft")}
              >
                <PlanifyIcon name="fileText" className="h-4 w-4" />
                Minha {targetLabel}
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                  {selectedItems.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEmbeddedActiveTab("bank")}
                className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm ${
                  embeddedActiveTab === "bank"
                    ? "border-blue-500 bg-blue-50 font-black text-slate-950"
                    : "border-transparent font-bold text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlanifyIcon name="library" className="h-4 w-4" />
                Banco de questões
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                <PlanifyIcon name="spark" className="h-4 w-4" />
                Criar com IA
              </button>
            </div>
          </div>

          {embeddedActiveTab === "draft" ? (
            <div className="min-h-[calc(74vh-104px)] px-4 py-4 sm:px-6">
              <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                        Minha {targetLabel}
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-950">
                        {selectedItems.length} questão(ões)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmbeddedActiveTab("bank")}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Adicionar mais
                    </button>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-sm font-bold text-slate-700">
                        Nenhuma questão adicionada ainda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setEmbeddedActiveTab("bank")}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                      >
                        Buscar questões
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-2">
                      {selectedItems.map((item, index) => {
                        const display = resolveQuestionDisplay(item);
                        return (
                          <article
                            key={`draft-${item.id}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex items-start gap-3">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-3 text-xs font-semibold leading-relaxed text-slate-800">
                                  {display.enunciado}
                                </p>
                                <p className="mt-1 text-[11px] font-bold text-slate-500">
                                  {item.componente} · {item.anoSerie}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveSelectedItem(item.id, -1)}
                                disabled={index === 0}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                              >
                                Subir
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSelectedItem(item.id, 1)}
                                disabled={index === selectedItems.length - 1}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                              >
                                Descer
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSelectedItem(item.id)}
                                className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                              >
                                Remover
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void montarAvaliacao(targetMaterial ?? "prova")}
                      disabled={assembling || selectedItems.length === 0}
                      className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assembling ? "Gerando..." : `Gerar ${targetLabel}`}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      disabled={selectedItems.length === 0}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Limpar seleção
                    </button>
                  </div>
                </aside>

                <main className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                  {embeddedDraftHtml ? (
                    <MaterialTypedPreview
                      html={embeddedDraftHtml}
                      tipoMaterial={targetMaterial ?? "prova"}
                    />
                  ) : (
                    <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        A prévia da prova aparece aqui conforme você adiciona questões.
                      </p>
                    </div>
                  )}
                </main>
              </div>
            </div>
          ) : (
          <div className="grid min-h-[calc(74vh-104px)] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:border-b-0 lg:border-r">
              <div className="space-y-5">
                <label className="block">
                  <span className={HUD_SECTION_LABEL}>Ano escolar</span>
                  <select
                    value={filter.anoSerie}
                    onChange={(event) => patchFilter({ anoSerie: event.target.value })}
                    className={HUD_FIELD_CLASS}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year === "todos" ? "Todos" : year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={HUD_SECTION_LABEL}>Disciplina</span>
                  <select
                    value={filter.componente}
                    onChange={(event) => patchFilter({ componente: event.target.value })}
                    className={HUD_FIELD_CLASS}
                  >
                    {componenteOptions.map((component) => (
                      <option key={component} value={component}>
                        {component === "todos" ? "Todas" : component}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={HUD_SECTION_LABEL}>Assunto</span>
                  <div className="flex gap-2">
                    <input
                      value={draftQuery}
                      onChange={(event) => setDraftQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          startEmbeddedBankSearch();
                        }
                      }}
                      placeholder="Figuras de linguagem"
                      className={HUD_FIELD_CLASS}
                    />
                    <button
                      type="button"
                      onClick={startEmbeddedBankSearch}
                      aria-label="Buscar assunto"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 hover:bg-blue-50"
                    >
                      <PlanifyIcon name="search" className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className={HUD_SECTION_LABEL}>Tipo de questões</span>
                    <span className="text-[10px] font-bold text-slate-400">Opcional</span>
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50">
                    {(
                      [
                        ["discursiva", "Discursiva"],
                        ["objetiva", "Objetiva"],
                      ] as Array<[EmbeddedQuestionKind, string]>
                    ).map(([kind, label]) => (
                      <label
                        key={kind}
                        className="flex min-h-10 cursor-pointer items-center gap-2 border-b border-slate-200 px-3 text-sm font-semibold text-slate-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={embeddedTypeFilters[kind]}
                          onChange={() => toggleEmbeddedTypeFilter(kind)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className={HUD_SECTION_LABEL}>Fontes</span>
                    <span className="text-[10px] font-bold text-slate-400">Opcional</span>
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50">
                    {embeddedSourceFilters.map((option) => (
                      <label
                        key={option.source}
                        className="flex min-h-10 cursor-pointer items-center gap-2 border-b border-slate-200 px-3 text-sm font-semibold text-slate-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={filter.source === option.source}
                          onChange={() =>
                            patchFilter({
                              source:
                                filter.source === option.source && option.source !== "todas"
                                  ? "todas"
                                  : option.source,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className={HUD_SECTION_LABEL}>Dificuldade</span>
                    <span className="text-[10px] font-bold text-slate-400">Opcional</span>
                  </div>
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50">
                    {EMBEDDED_DIFFICULTY_OPTIONS.map((difficulty) => (
                      <label
                        key={difficulty}
                        className="flex min-h-10 cursor-pointer items-center gap-2 border-b border-slate-200 px-3 text-sm font-semibold text-slate-700 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={embeddedDifficultyFilters[difficulty]}
                          onChange={() => toggleEmbeddedDifficultyFilter(difficulty)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        {getEmbeddedDifficultyLabel(difficulty)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <main className="min-w-0 px-4 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-5xl">
                <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-600">
                    <span>
                      {embeddedPageStart}-{embeddedPageEnd} de {embeddedBankItems.length} questões
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEmbeddedBankPage((page) => Math.max(1, page - 1))}
                        disabled={embeddedSafePage === 1}
                        aria-label="Página anterior"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
                      </button>
                      {embeddedPageNumbers.map((page, index) => {
                        const previous = embeddedPageNumbers[index - 1];
                        return (
                          <span key={page} className="inline-flex items-center gap-1">
                            {previous && page - previous > 1 ? (
                              <span className="px-1 text-xs text-slate-400">...</span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setEmbeddedBankPage(page)}
                              className={`h-8 min-w-8 rounded-lg px-2 text-xs font-black ${
                                page === embeddedSafePage
                                  ? "bg-blue-100 text-blue-700"
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {page}
                            </button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() =>
                          setEmbeddedBankPage((page) =>
                            Math.min(embeddedBankTotalPages, page + 1),
                          )
                        }
                        disabled={embeddedSafePage === embeddedBankTotalPages}
                        aria-label="Próxima página"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                      >
                        <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {syncing ? (
                  <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
                    Sincronizando banco...
                  </p>
                ) : embeddedPagedItems.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center">
                    <p className="text-sm font-black text-slate-800">Nenhuma questão encontrada.</p>
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setEmbeddedBankStep("setup");
                      }}
                      className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Refazer busca
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {embeddedPagedItems.map((item) => {
                      const selected = selectedIds.has(item.id);
                      const display = resolveQuestionDisplay(item);
                      const difficulty = getEmbeddedQuestionDifficulty(item);
                      const kind = getEmbeddedQuestionKind(item);
                      return (
                        <article
                          key={item.id}
                          className={`rounded-lg border bg-white p-4 shadow-sm ${
                            selected ? "border-blue-500 ring-1 ring-blue-200" : "border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700">
                                  {getEmbeddedDifficultyLabel(difficulty)}
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                  {getEmbeddedQuestionSourceLabel(item)}
                                </span>
                                <span className="text-xs font-bold text-slate-400">•</span>
                                <span className="text-xs font-bold text-slate-500">
                                  {getEmbeddedQuestionYear(item)}
                                </span>
                                <span className="text-xs font-bold text-slate-400">•</span>
                                <span className="text-xs font-bold text-slate-500">
                                  {kind === "objetiva" ? "Objetiva" : "Discursiva"}
                                </span>
                              </div>
                              {display.textoApoio ? (
                                <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium leading-relaxed text-slate-600">
                                  {display.textoApoio}
                                </p>
                              ) : null}
                              <p className="text-sm font-semibold leading-relaxed text-slate-950">
                                {display.enunciado}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleSelect(item.id)}
                              className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-4 text-xs font-black transition ${
                                selected
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              }`}
                            >
                              {selected ? "Adicionada" : "Adicionar"}
                            </button>
                          </div>

                          {item.alternativas.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              {item.alternativas.map((alternative, index) => {
                                const correct = isExpectedAlternative(item, alternative, index);
                                const label = ALTERNATIVE_LABELS[index] || String(index + 1);
                                return (
                                  <div
                                    key={`${item.id}-${index}`}
                                    className="flex items-start gap-3 text-sm text-slate-700"
                                  >
                                    <span
                                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${
                                        correct
                                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                          : "border-slate-300 text-slate-500"
                                      }`}
                                    >
                                      {correct ? "✓" : ""}
                                    </span>
                                    <span className="font-bold text-slate-600">{label}.</span>
                                    <span className="min-w-0 flex-1 leading-relaxed">
                                      {alternative}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : item.respostaEsperada ? (
                            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium leading-relaxed text-slate-600">
                              Resposta esperada: {item.respostaEsperada}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
          </div>
          )}
        </div>
      )}

      <GenerationErrorBanner
        message={importError}
        retryable={importRetryable}
        onRetry={() => {
          setImportError("");
          startEmbeddedBankSearch();
        }}
      />

      {selectedItems.length > 0 && embeddedActiveTab === "bank" ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-slate-800">
              {selectedItems.length} questão(ões) na minha {targetLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setEmbeddedActiveTab("draft")}
                disabled={assembling}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Ver minha {targetLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const content = (
    <>
      <div className={`space-y-6 px-4 py-6 sm:px-6${selectedItems.length > 0 ? " pb-28" : ""}`}>

        {embedded && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-fit text-xs font-bold text-cyan-800 underline underline-offset-4"
          >
            Voltar para gerar com IA
          </button>
        ) : null}

        {!embedded ? (
        <section className="overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-sky-50 shadow-sm">
          <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
                  Biblioteca inteligente
                </p>
                <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
                  Ache a questão certa sem navegar no escuro
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                  Comece por um acervo, pesquise pelo tema e coloque na cesta. Só então escolha
                  se quer uma prova ou uma lista.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                Curadoria rastreável
              </span>
            </div>

            {embedded && onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="w-fit text-xs font-bold text-cyan-800 underline underline-offset-4"
              >
                Voltar para gerar com IA
              </button>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "No seu recorte",
                  value: syncing ? "—" : String(searchMode === "browse" ? filtered.length : visibleItems.length),
                  hint: searchActive ? "resultados encontrados" : "questões disponíveis",
                },
                {
                  label: "Acervo público",
                  value: String(curationSummary?.totalPublic ?? inventory.total),
                  hint: "questões compartilhadas",
                },
                {
                  label: "Curadas",
                  value: String(curationSummary?.curated ?? inventory.curated),
                  hint: "revisadas por fonte ou robô",
                },
                {
                  label: "Alta complexidade",
                  value: String(
                    (curationSummary?.byCollection.enem ?? 0) +
                      (curationSummary?.byCollection.vestibular ?? 0) +
                      (curationSummary?.byCollection.concurso ?? 0) +
                      (curationSummary?.byCollection.superior ?? 0) ||
                      inventory.advanced,
                  ),
                  hint: "ENEM, superior e concursos",
                },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white bg-white/85 px-3 py-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{stat.value}</p>
                  <p className="text-[11px] font-medium text-slate-500">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        ) : null}

        {!embedded ? (
        <section aria-label="Escolha rápida do acervo" className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">1. Escolha um acervo</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Você pode mudar o recorte a qualquer momento.</p>
            </div>
            {filter.source !== "curadas" ? (
              <button
                type="button"
                onClick={() => patchFilter({ source: "curadas" })}
                className="text-xs font-bold text-cyan-800 underline underline-offset-4"
              >
                Ver somente curadas
              </button>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {QUICK_CATALOGS.map((catalog) => {
              const active = filter.etapa === catalog.etapa;
              return (
                <button
                  key={catalog.etapa}
                  type="button"
                  onClick={() => applyQuickCatalog(catalog.etapa)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-cyan-500 bg-cyan-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300 hover:bg-cyan-50/60"
                  }`}
                >
                  <span className="block text-sm font-extrabold">{catalog.label}</span>
                  <span className={`mt-0.5 block text-[11px] font-medium ${active ? "text-cyan-50" : "text-slate-500"}`}>
                    {catalog.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="sr-only">Filtros do banco de questões</legend>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">2. Refine a busca</p>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Use só os filtros que ajudam agora; tema é opcional, mas deixa o resultado bem mais preciso.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="qb-etapa">
                Nível escolar
              </label>
              <select
                id="qb-etapa"
                value={filter.etapa}
                onChange={(event) =>
                  patchFilter({
                    etapa: event.target.value as QuestionBankFilter["etapa"],
                  })
                }
                aria-label="Filtrar por nível escolar"
                className={HUD_FIELD_CLASS}
              >
                {QUESTION_BANK_ETAPA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="qb-ano">
                Série / ano
              </label>
              <select
                id="qb-ano"
                value={filter.anoSerie}
                onChange={(event) => patchFilter({ anoSerie: event.target.value })}
                aria-label="Filtrar por série ou ano"
                className={HUD_FIELD_CLASS}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "todos" ? "Todas" : option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="qb-comp">
                Disciplina
              </label>
              <select
                id="qb-comp"
                value={filter.componente}
                onChange={(event) => patchFilter({ componente: event.target.value })}
                aria-label="Filtrar por disciplina"
                className={HUD_FIELD_CLASS}
              >
                {componenteOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "todos" ? "Todas" : option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="qb-source">
                Origem
              </label>
              <select
                id="qb-source"
                value={filter.source}
                onChange={(event) =>
                  patchFilter({
                    source: event.target.value as QuestionBankSource,
                  })
                }
                aria-label="Filtrar por origem das questões"
                className={HUD_FIELD_CLASS}
              >
                {sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            {sourceOptions.find((option) => option.id === filter.source)?.hint}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="block" htmlFor="qb-tema">
                <span className={HUD_SECTION_LABEL}>Tema da aula</span>
                <input
                  id="qb-tema"
                  value={draftQuery}
                  onChange={(event) => setDraftQuery(event.target.value)}
                  placeholder="Digite o tema para buscar questões"
                  className={HUD_FIELD_CLASS}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      runQuestionBankSearch();
                    }
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={runQuestionBankSearch}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-cyan-700"
            >
              <PlanifyIcon name="search" className="h-4 w-4" />
              Buscar
            </button>
          </div>
          <p className="text-[11px] font-medium text-slate-500">
            Informe o tema e clique em <strong className="text-slate-700">Buscar</strong>.
          </p>

          {searchPending && searchActive ? (
            <p className="text-[11px] font-semibold text-amber-700">
              Filtros alterados — clique em Buscar para atualizar os resultados.
            </p>
          ) : null}

          {bnccSupportedStage ? (
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="text-xs font-semibold text-slate-600 underline"
            >
              {showAdvanced ? "Ocultar filtro avançado" : "Filtro avançado (código BNCC manual)"}
            </button>
          ) : null}
          {bnccSupportedStage && showAdvanced ? (
            <div className="max-w-xs space-y-1">
              <label className={HUD_SECTION_LABEL} htmlFor="qb-bncc">
                Código BNCC (opcional)
              </label>
              <input
                id="qb-bncc"
                value={manualBncc}
                onChange={(event) => setManualBncc(event.target.value)}
                placeholder="EF05HI06"
                aria-label="Filtrar por código BNCC manual"
                className={HUD_FIELD_CLASS}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {filterActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-rose-700 underline"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

        </fieldset>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">3. Selecione e monte</span>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Adicionar questões próprias
            </summary>
            <div className="absolute left-0 top-11 z-20 flex min-w-56 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() => void importFromHistory()}
                className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-50"
              >
                Importar do histórico
              </button>
              <button
                type="button"
                onClick={() => void openServerImportModal()}
                className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-50"
              >
                Importar do servidor
              </button>
            </div>
          </details>
          {visibleItems.length > 0 && showQuestionList ? (
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Selecionar todas visíveis ({visibleItems.length})
            </button>
          ) : null}
          {selectedItems.length > 0 ? (
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Limpar seleção
            </button>
          ) : null}
          {!targetMaterial || targetMaterial === "prova" ? (
            <button
              type="button"
              onClick={() => void montarAvaliacao("prova")}
              disabled={assembling || selectedItems.length === 0}
              className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assembling ? "Montando…" : `Montar prova (${selectedItems.length})`}
            </button>
          ) : null}
          {!targetMaterial || targetMaterial === "lista" ? (
            <button
              type="button"
              onClick={() => void montarAvaliacao("lista")}
              disabled={assembling || selectedItems.length === 0}
              className="rounded-xl border border-cyan-400/40 bg-white px-4 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assembling ? "Montando…" : `Montar lista (${selectedItems.length})`}
            </button>
          ) : null}
        </div>

        {selectedItems.length > 0 ? (
          <p className="text-sm font-semibold text-cyan-800">
            {selectedItems.length} questão(ões) selecionada(s) — clique em Montar {targetMaterial ?? "prova ou lista"} para enviar ao editor.
          </p>
        ) : null}

        {importStatus ? (
          <p className="text-sm font-medium text-cyan-800">{importStatus}</p>
        ) : null}

        <GenerationErrorBanner
          message={importError}
          retryable={importRetryable}
          onRetry={() => {
            setImportError("");
            void openServerImportModal();
          }}
        />

        {syncing ? (
          <p className="text-sm font-medium text-slate-500">Sincronizando banco…</p>
        ) : embedded && searchMode === "browse" ? (
          <p className="rounded-xl border border-cyan-400/20 bg-cyan-50/50 px-4 py-3 text-sm font-semibold text-slate-600">
            Informe o tema e clique em <strong className="text-slate-800">Buscar</strong> para
            ver questões do seu acervo.
          </p>
        ) : searchMode === "browse" ? (
          <p className="text-sm font-semibold text-slate-600">
            {filtered.length} questão(ões) no acervo
            {filterActive ? " com os filtros atuais" : ""}
            {" — use Buscar para pesquisar por tema e BNCC."}
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-600">
            {filtered.length} compatível(is)
            {relatedItems.length > 0 ? ` · ${relatedItems.length} relacionada(s)` : ""}
            {effectiveFilter.etapa !== "todos" ? ` · ${effectiveFilter.etapa}` : ""}
            {effectiveFilter.componente !== "todos"
              ? ` · ${effectiveFilter.componente}`
              : ""}
            {effectiveFilter.anoSerie !== "todos" ? ` · ${effectiveFilter.anoSerie}` : ""}
            {effectiveFilter.query.trim()
              ? ` · tema “${effectiveFilter.query.trim()}”`
              : ""}
          </p>
        )}

        <div className="space-y-3">
          {showQuestionList && filtered.length > 0
           ? filtered.map((item) => {
            const selected = selectedIds.has(item.id);
            const display = resolveQuestionDisplay(item);
            const collection = getQuestionBankCollection(item);
            const humanReviewed = isHumanReviewedQuestion(item);
            const sourceUrl = getSafeExternalUrl(item.sourceUrl);
            return (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                  selected ? "border-cyan-500 ring-1 ring-cyan-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        className={`min-h-[2.75rem] px-3 py-2 ${
                          selected ? HUD_FILTER_CHIP_ACTIVE : HUD_FILTER_CHIP_INACTIVE
                        }`}
                      >
                        {selected ? "Selecionada" : "Selecionar"}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {item.componente} · {item.anoSerie}
                      </span>
                      {collection !== "geral" && collection !== "escolar" ? (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800">
                          {collection === "enem"
                            ? "ENEM"
                            : collection === "vestibular"
                              ? "Vestibular"
                              : collection === "concurso"
                                ? "Concurso"
                                : "Superior"}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          humanReviewed
                            ? "bg-emerald-100 text-emerald-800"
                            : item.reviewStatus === "automated"
                              ? "bg-cyan-100 text-cyan-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getQuestionReviewLabel(item)}
                      </span>
                      {item.matchScore >= 8 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                          Alta compatibilidade
                        </span>
                      ) : null}
                      {item.isCommunity ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                          Comunidade
                        </span>
                      ) : null}
                      {item.isSchool ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          Escola
                        </span>
                      ) : null}
                      {(item.isCommunity || item.isSchool) && item.authorName ? (
                        <span className="text-[10px] font-semibold text-slate-600">
                          por {item.authorName}
                        </span>
                      ) : null}
                      {typeof item.usageCount === "number" && item.usageCount > 0 ? (
                        <span className="text-[10px] font-semibold text-slate-500">
                          Usada {item.usageCount}×
                        </span>
                      ) : null}
                    </div>
                    {display.textoApoio ? (
                      <details className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                          Texto de apoio
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                          {display.textoApoio}
                        </p>
                      </details>
                    ) : null}
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                      {display.enunciado}
                    </p>
                    {item.imageUrls?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.imageUrls.slice(0, 3).map((url, index) => (
                          <a
                            key={`${item.id}-image-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
                          >
                            <img
                              src={url}
                              alt={`Imagem da questao ${index + 1}`}
                              className="h-24 w-32 object-contain"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                      <span>{item.tipo}</span>
                      {item.bnccCodigos.map((code) => (
                        <span key={code} className="rounded bg-cyan-50 px-1.5 py-0.5 text-cyan-800">
                          {code}
                        </span>
                      ))}
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {(item.sourceTitle || item.qualityScore !== undefined) ? (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                        {item.sourceTitle ? (
                          sourceUrl ? (
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-800 underline underline-offset-2"
                            >
                              Fonte: {item.sourceTitle}
                              <PlanifyIcon name="externalLink" className="h-3 w-3" />
                            </a>
                          ) : (
                            <span>Origem: {item.sourceTitle}</span>
                          )
                        ) : null}
                        {typeof item.qualityScore === "number" ? (
                          <span>Qualidade do robô: {item.qualityScore.toFixed(1)}/10</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openRemixModal(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/25 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-50"
                    >
                      <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
                      Remixar
                    </button>
                    {!item.isCommunity && !item.isSchool ? (
                      <>
                        {school.hasSchool ? (
                          <button
                            type="button"
                            onClick={() => void compartilharComEscola(item)}
                            disabled={publishingId === item.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Compartilhar com a escola
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void publicarNaComunidade(item)}
                          disabled={publishingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50"
                        >
                          Publicar na comunidade
                        </button>
                        <button
                          type="button"
                          onClick={() => void excluirItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
            : null}
        </div>

        {!syncing && showQuestionList && searchActive && relatedItems.length > 0 && filtered.length === 0 ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Relacionadas
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Nenhuma exata para este tema e série — opções no mesmo nível escolar com tema
                parecido ou área BNCC compatível.
              </p>
            </div>
            {relatedItems.map((item) => {
              const display = resolveQuestionDisplay(item);
              return (
                <article
                  key={`related-${item.id}`}
                  className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {item.componente} · {item.anoSerie}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className={
                        selectedIds.has(item.id)
                          ? HUD_FILTER_CHIP_ACTIVE
                          : HUD_FILTER_CHIP_INACTIVE
                      }
                    >
                      {selectedIds.has(item.id) ? "Selecionada" : "Selecionar"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{display.enunciado}</p>
                </article>
              );
            })}
          </div>
        ) : null}

        {remixSource && remixDraft ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-900">Remixar questão</h3>
              <p className="mt-1 text-sm text-slate-600">
                Edite antes de salvar uma cópia pessoal.
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className={HUD_SECTION_LABEL} htmlFor="remix-enunciado">
                    Enunciado
                  </label>
                  <textarea
                    id="remix-enunciado"
                    value={remixDraft.enunciado}
                    onChange={(event) =>
                      setRemixDraft((current) =>
                        current
                          ? { ...current, enunciado: event.target.value }
                          : current,
                      )
                    }
                    rows={4}
                    className={HUD_TEXTAREA_CLASS}
                  />
                </div>
                <div>
                  <label className={HUD_SECTION_LABEL} htmlFor="remix-tipo">
                    Tipo
                  </label>
                  <input
                    id="remix-tipo"
                    value={remixDraft.tipo}
                    onChange={(event) =>
                      setRemixDraft((current) =>
                        current ? { ...current, tipo: event.target.value } : current,
                      )
                    }
                    className={HUD_FIELD_CLASS}
                  />
                </div>
                <div>
                  <label className={HUD_SECTION_LABEL} htmlFor="remix-alts">
                    Alternativas (uma por linha)
                  </label>
                  <textarea
                    id="remix-alts"
                    value={remixDraft.alternativas}
                    onChange={(event) =>
                      setRemixDraft((current) =>
                        current
                          ? { ...current, alternativas: event.target.value }
                          : current,
                      )
                    }
                    rows={3}
                    className={HUD_TEXTAREA_CLASS}
                  />
                </div>
                <div>
                  <label className={HUD_SECTION_LABEL} htmlFor="remix-gabarito">
                    Gabarito / resposta esperada
                  </label>
                  <textarea
                    id="remix-gabarito"
                    value={remixDraft.respostaEsperada}
                    onChange={(event) =>
                      setRemixDraft((current) =>
                        current
                          ? { ...current, respostaEsperada: event.target.value }
                          : current,
                      )
                    }
                    rows={2}
                    className={HUD_TEXTAREA_CLASS}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemixSource(null);
                    setRemixDraft(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveRemix}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Salvar remix
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {serverModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Importar do servidor
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Selecione provas e listas salvas na nuvem.
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto px-5 py-3">
                {serverLoading ? (
                  <p className="text-sm text-slate-600">Carregando materiais…</p>
                ) : serverSources.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Nenhum material com questões encontrado no servidor.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {serverSources.map((source) => (
                      <li key={source.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={serverSelectedIds.has(source.id)}
                            onChange={() => toggleServerSource(source.id)}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">
                              {source.title}
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {source.tipo} · {source.questaoCount} questão(ões)
                              {source.discipline ? ` · ${source.discipline}` : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setServerModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void importFromServer()}
                  disabled={serverImporting || serverSelectedIds.size === 0}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {serverImporting ? "Importando…" : "Importar selecionados"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showCommunityEmpty ? (
          <div className="rounded-2xl border border-dashed border-violet-300/40 bg-violet-50/50 px-6 py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Comunidade
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              Seja o primeiro a publicar
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Publique uma questão pessoal para compartilhar com outros professores.
            </p>
          </div>
        ) : null}

        {!syncing &&
        filtered.length === 0 &&
        relatedItems.length === 0 &&
        filter.source !== "comunidade" ? (
          <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-white/70 px-6 py-12 text-center">
            {allItems.length === 0 ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Banco vazio
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Comece importando suas provas
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Gere uma prova ou lista em Meus materiais, ou aguarde o acervo da comunidade
                  crescer.
                </p>
              </>
            ) : searchActive ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Nenhuma compatível
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Ajuste disciplina, série ou tema
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Ajuste o tema e clique em Buscar. Questões de outro nível ou série não
                  aparecem nesta busca.
                </p>
              </>
            ) : filterActive ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Nenhuma neste recorte
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  Amplie os filtros para ver mais questões
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Tente outro nível, disciplina ou série — ou limpe os filtros para ver todo o
                  acervo disponível.
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedItems.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-sm font-bold text-slate-800">
              {selectedItems.length} questão(ões) na cesta
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Limpar
              </button>
              {!targetMaterial || targetMaterial === "lista" ? (
                <button
                  type="button"
                  onClick={() => void montarAvaliacao("lista")}
                  disabled={assembling}
                  className="rounded-xl border border-cyan-400/40 bg-white px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-50 disabled:opacity-50"
                >
                  {assembling ? "Montando…" : "Montar lista"}
                </button>
              ) : null}
              {!targetMaterial || targetMaterial === "prova" ? (
                <button
                  type="button"
                  onClick={() => void montarAvaliacao("prova")}
                  disabled={assembling}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {assembling ? "Montando…" : "Montar prova"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {embeddedBankContent}
      </section>
    );
  }

  return <PlanifyWorkspacePane header={pageHeader}>{content}</PlanifyWorkspacePane>;
}

export default BancoQuestoesClient;
