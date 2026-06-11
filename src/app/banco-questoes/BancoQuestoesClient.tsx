"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
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
  stashQuestionsForProva,
} from "@/lib/banco-questoes/question-bank-storage";
import { TemaCombobox } from "@/components/bncc/TemaCombobox";
import type { BnccTemaAutocompleteSuggestion } from "@/lib/bncc/bncc-tema-autocomplete";
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
];

function newId(): string {
  return `qb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLocalOnlyQuestionId(id: string): boolean {
  return id.startsWith("qb-");
}

function buildAvaliacaoTitle(tipo: "prova" | "lista", tema: string): string {
  const label = tipo === "lista" ? "Lista" : "Prova";
  return `${label} — ${tema.trim() || "Material Planify"}`;
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

type RemixDraft = {
  enunciado: string;
  tipo: string;
  alternativas: string;
  respostaEsperada: string;
};

export function BancoQuestoesClient() {
  const router = useRouter();
  const school = useSchoolClasses();
  const [items, setItems] = useState<QuestionBankItem[]>([]);
  const [communityItems, setCommunityItems] = useState<QuestionBankItem[]>([]);
  const [schoolItems, setSchoolItems] = useState<QuestionBankItem[]>([]);
  const [syncing, setSyncing] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<QuestionBankFilter>(DEFAULT_QUESTION_BANK_FILTER);
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

  const allItems = useMemo(
    () => [...items, ...communityItems, ...schoolItems],
    [communityItems, items, schoolItems],
  );

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

  const searchResult = useMemo(() => {
    return searchQuestionBankItems(allItems, filter);
  }, [allItems, filter]);

  const filtered = searchResult.items;
  const relatedItems = searchResult.related;
  const searchMode = searchResult.mode;
  const searchActive = isQuestionBankSearchActive(filter);
  const filterActive = isQuestionBankFilterActive(filter);
  const searchFallback = searchResult.fallback;

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

  const visibleItems = useMemo(
    () => [...filtered, ...relatedItems],
    [filtered, relatedItems],
  );

  function handleTemaSuggestionSelect(suggestion: BnccTemaAutocompleteSuggestion) {
    const codes = suggestion.habilidades.map((skill) => skill.codigo).filter(Boolean);
    const skill = suggestion.habilidades[0];
    const etapaPatch =
      filter.etapa === "todos" && skill?.etapa
        ? (skill.etapa as QuestionBankFilter["etapa"])
        : filter.etapa;

    patchFilter({
      query: suggestion.tema,
      bncc: "",
      bnccCodigos: codes.length ? codes : undefined,
      etapa: etapaPatch,
      componente:
        filter.componente === "todos" && suggestion.componente
          ? suggestion.componente
          : filter.componente,
      anoSerie:
        filter.anoSerie === "todos" && skill?.anoSerie
          ? skill.anoSerie
          : filter.anoSerie,
    });
  }

  function clearBnccAutoFilter() {
    setFilter((current) => ({
      ...current,
      bnccCodigos: undefined,
    }));
  }

  function resetFilters() {
    setFilter(DEFAULT_QUESTION_BANK_FILTER);
    setSelectedIds(new Set());
    setShowAdvanced(false);
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
      filter.query.trim() || selected[0]?.tema.trim() || "Avaliação do banco";
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
        setSelectedIds(new Set());
        setImportStatus(
          `${selected.length} questão(ões) montadas — editor aberto.`,
        );
        return;
      }

      for (const item of selected) {
        void incrementQuestionUsage(item.id);
      }
      stashQuestionsForProva(selected);
      router.push(dashboardToolHref(tipoMaterial));
      setImportStatus(
        `${selected.length} questão(ões) enviadas — revise em Meus materiais e clique em Criar.`,
      );
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

  return (
    <PlanifyWorkspacePane
      header={
        <PlanifyPageHero
          title="Banco de questões"
          description="Navegue pelo acervo completo ou refine por nível, disciplina, série e tema."
          icon="library"
        />
      }
    >
      <div className="space-y-6 px-4 py-6 sm:px-6">
        <details className="rounded-2xl border border-cyan-400/20 bg-cyan-50/40 px-4 py-3">
          <summary className="cursor-pointer text-sm font-bold text-cyan-900">
            Como o ecossistema Planify se conecta
          </summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium text-slate-700">
            <li>
              <strong>Meus materiais</strong> — todas as ferramentas usam a mesma entrega:
              banco → contexto pedagógico → motor com qualidade máxima (score verificado).
            </li>
            <li>
              <strong>Banco de questões</strong> — navegue, selecione e remixe questões da
              comunidade, da escola ou suas.
            </li>
            <li>
              <strong>Montar prova</strong> — leva as questões selecionadas para o gerador de
              prova com um clique.
            </li>
            <li>
              <strong>Editor</strong> — ajuste o material; exporte para Google só quando quiser.
            </li>
          </ol>
        </details>

        <fieldset className="space-y-3">
          <legend className="sr-only">Filtros do banco de questões</legend>
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

          <TemaCombobox
            label="Tema da aula"
            value={filter.query}
            onChange={(value) =>
              setFilter((current) => ({
                ...current,
                query: value,
                bnccCodigos: value.trim() ? current.bnccCodigos : undefined,
                bncc: value.trim() ? current.bncc : "",
              }))
            }
            onSelectSuggestion={handleTemaSuggestionSelect}
            etapa={filter.etapa === "todos" ? undefined : filter.etapa}
            componente={filter.componente === "todos" ? undefined : filter.componente}
            anoSerie={filter.anoSerie === "todos" ? undefined : filter.anoSerie}
            placeholder="Ex.: tipos de sujeito, frações, Brasil colonial…"
            className="w-full"
          />
          <p className="text-[11px] font-medium text-slate-500">
            Escolha uma sugestão da lista para alinhar BNCC automaticamente — sem digitar código.
          </p>

          {filter.bnccCodigos?.length ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                BNCC (automático)
              </span>
              {filter.bnccCodigos.map((code) => (
                <span
                  key={code}
                  className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[11px] font-bold text-cyan-900"
                >
                  {code}
                </span>
              ))}
              <button
                type="button"
                onClick={clearBnccAutoFilter}
                className="text-[11px] font-semibold text-slate-500 underline"
              >
                Limpar BNCC
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="text-xs font-semibold text-slate-600 underline"
          >
            {showAdvanced ? "Ocultar filtro avançado" : "Filtro avançado (código BNCC manual)"}
          </button>
          {showAdvanced ? (
            <div className="max-w-xs space-y-1">
              <label className={HUD_SECTION_LABEL} htmlFor="qb-bncc">
                Código BNCC (opcional)
              </label>
              <input
                id="qb-bncc"
                value={filter.bncc}
                onChange={(event) =>
                  setFilter((current) => ({
                    ...current,
                    bncc: event.target.value,
                    bnccCodigos: event.target.value.trim()
                      ? undefined
                      : current.bnccCodigos,
                  }))
                }
                placeholder="EF05HI06"
                disabled={Boolean(filter.bnccCodigos?.length)}
                aria-label="Filtrar por código BNCC manual"
                className={HUD_FIELD_CLASS}
              />
              {filter.bnccCodigos?.length ? (
                <p className="text-[11px] font-medium text-slate-500">
                  BNCC automático ativo — limpe os chips acima para usar código manual.
                </p>
              ) : null}
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void importFromHistory()}
            className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Importar do histórico
          </button>
          <button
            type="button"
            onClick={() => void openServerImportModal()}
            className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
          >
            Importar do servidor
          </button>
          {visibleItems.length > 0 ? (
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
          <button
            type="button"
            onClick={() => void montarAvaliacao("prova")}
            disabled={assembling || selectedItems.length === 0}
            className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assembling
              ? "Montando…"
              : `Montar prova (${selectedItems.length})`}
          </button>
          <button
            type="button"
            onClick={() => void montarAvaliacao("lista")}
            disabled={assembling || selectedItems.length === 0}
            className="rounded-xl border border-cyan-400/40 bg-white px-4 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assembling
              ? "Montando…"
              : `Montar lista (${selectedItems.length})`}
          </button>
        </div>

        {selectedItems.length > 0 ? (
          <p className="text-sm font-semibold text-cyan-800">
            {selectedItems.length} questão(ões) selecionada(s) — clique em Montar prova ou
            Montar lista para enviar ao editor.
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
        ) : searchMode === "browse" ? (
          <p className="text-sm font-semibold text-slate-600">
            {filtered.length} questão(ões) no acervo
            {filterActive ? " com os filtros atuais" : ""}
            {searchActive ? "" : " — digite um tema para busca mais precisa."}
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-600">
            {filtered.length} compatível(is)
            {relatedItems.length > 0
              ? searchFallback === "structural"
                ? ` · ${relatedItems.length} no acervo filtrado`
                : ` · ${relatedItems.length} relacionada(s)`
              : ""}
            {filter.etapa !== "todos" ? ` · ${filter.etapa}` : ""}
            {filter.componente !== "todos" ? ` · ${filter.componente}` : ""}
            {filter.anoSerie !== "todos" ? ` · ${filter.anoSerie}` : ""}
            {filter.query.trim() ? ` · tema “${filter.query.trim()}”` : ""}
          </p>
        )}

        <div className="space-y-3">
          {filtered.length > 0
            ? filtered.map((item) => {
            const selected = selectedIds.has(item.id);
            const display = resolveQuestionDisplay(item);
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
                        className={
                          selected ? HUD_FILTER_CHIP_ACTIVE : HUD_FILTER_CHIP_INACTIVE
                        }
                      >
                        {selected ? "Selecionada" : "Selecionar"}
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {item.componente} · {item.anoSerie}
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

        {!syncing && searchActive && relatedItems.length > 0 && filtered.length === 0 ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                {searchFallback === "structural" ? "Acervo filtrado" : "Relacionadas"}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {searchFallback === "structural"
                  ? "Nenhuma questão exata para este tema — mostrando o acervo com os filtros de nível, disciplina e série."
                  : "Nenhuma exata para este tema e série — veja opções próximas (outras séries ou tema parecido)."}
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
              <h3 className="text-base font-extrabold text-slate-950">Remixar questão</h3>
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
                <h3 className="text-base font-extrabold text-slate-950">
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
            <h3 className="mt-2 text-lg font-extrabold text-slate-950">
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
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">
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
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                  Ajuste disciplina, série ou tema
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  Escolha uma sugestão de tema na lista — a BNCC é aplicada automaticamente. Ou
                  amplie a série para ver mais questões da disciplina.
                </p>
              </>
            ) : filterActive ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                  Nenhuma neste recorte
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">
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
    </PlanifyWorkspacePane>
  );
}

export default BancoQuestoesClient;
