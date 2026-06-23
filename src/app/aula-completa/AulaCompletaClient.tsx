"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { SwipeTabPanel } from "@/components/pro/SwipeTabPanel";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import {
  DEFAULT_LESSON_BUNDLE_TOOLS,
  getLessonBundleCreditCost,
} from "@/lib/aula-completa/lesson-bundle-config";
import type { LessonBundleItem } from "@/lib/aula-completa/lesson-bundle-client";
import { persistBundleItemToHistory } from "@/lib/aula-completa/lesson-bundle-persist-client";
import { requestLessonBundleItemRetry } from "@/lib/aula-completa/lesson-bundle-retry-client";
import { requestLessonBundleGenerationStream } from "@/lib/aula-completa/lesson-bundle-stream-client";
import type { BundleStepStatus } from "@/lib/aula-completa/lesson-bundle-stream-types";
import { getPlanifyTool, type PlanifyToolId } from "@/lib/pro/planifyTools";
import { getGenerationDurationEstimateMs } from "@/lib/pro/generation-progress";
import {
  dispatchCreditsChangedIfNeeded,
  formatDurationEstimateBadge,
  formatGenerationError,
  GenerationErrorBanner,
} from "@/lib/pro/generation-error-ui";
import { lessonBundleTools, lessonBundleObjetivoHint } from "@/lib/pro/teachyStudio";
import { DEFAULT_MATERIAL_EDUCATION } from "@/lib/educacao/education-options";
import {
  getMaterialFormFieldConfig,
  resolveMaterialDisplayTema,
} from "@/lib/educacao/material-form-config";
import { openMaterialInEditor } from "@/lib/materiais/material-editor-flow";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";

type AulaCompletaClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
  initialTema?: string;
};

const MOBILE_BUNDLE_TOOLS: PlanifyToolId[] = [...DEFAULT_LESSON_BUNDLE_TOOLS];
const PATIENCE_THRESHOLD_MS = 60_000;

const tool = getPlanifyTool("aula-completa");
const formFields = getMaterialFormFieldConfig("aula-completa");

function initialBundleSteps(toolIds: PlanifyToolId[]): Record<PlanifyToolId, BundleStepStatus> {
  return Object.fromEntries(
    toolIds.map((id) => [id, "pending" as BundleStepStatus]),
  ) as Record<PlanifyToolId, BundleStepStatus>;
}

function progressLabelForTool(toolId: PlanifyToolId, index: number, total: number): string {
  const label = getPlanifyTool(toolId).shortTitle.toLowerCase();
  return `Gerando ${label} (${index + 1}/${total})…`;
}

export function AulaCompletaClient({
  studioMode = false,
  onStudioClose,
  initialTema = "",
}: AulaCompletaClientProps = {}) {
  const school = useSchoolClasses();
  const [conteudo, setConteudo] = useState(initialTema);
  const [objetivo, setObjetivo] = useState(lessonBundleObjetivoHint);
  const [observacoes, setObservacoes] = useState("");
  const [selectedTools, setSelectedTools] = useState<PlanifyToolId[]>([
    ...DEFAULT_LESSON_BUNDLE_TOOLS,
  ]);
  const [loading, setLoading] = useState(false);
  const [retryingToolId, setRetryingToolId] = useState<PlanifyToolId | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [showPatienceMessage, setShowPatienceMessage] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [items, setItems] = useState<LessonBundleItem[]>([]);
  const [bundleSteps, setBundleSteps] = useState<Record<PlanifyToolId, BundleStepStatus>>(
    () => initialBundleSteps(selectedTools),
  );
  const [activeTab, setActiveTab] = useState<PlanifyToolId | null>(null);
  const [modalAberto, setModalAberto] = useState(studioMode);
  const abortRef = useRef<AbortController | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialTema.trim()) setConteudo(initialTema.trim());
  }, [initialTema]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSelectedTools([...MOBILE_BUNDLE_TOOLS]);
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const creditCost = useMemo(
    () => getLessonBundleCreditCost(selectedTools),
    [selectedTools],
  );

  const estimatedDurationMs = useMemo(
    () =>
      selectedTools.reduce(
        (acc, toolId) => acc + getGenerationDurationEstimateMs({ toolId }),
        0,
      ),
    [selectedTools],
  );

  const successItems = items.filter((item) => item.ok && item.html);
  const failedItems = items.filter((item) => !item.ok);
  const orderedTools = selectedTools;

  const persistContext = useMemo(
    () => ({
      tema: resolveMaterialDisplayTema("", conteudo),
      componente:
        school.selectedClass?.discipline?.trim() ||
        DEFAULT_MATERIAL_EDUCATION.componente,
      anoSerie: DEFAULT_MATERIAL_EDUCATION.anoSerie,
      etapa: DEFAULT_MATERIAL_EDUCATION.etapa,
    }),
    [conteudo, school.selectedClass?.discipline],
  );

  function toggleTool(toolId: PlanifyToolId) {
    setSelectedTools((current) => {
      if (current.includes(toolId)) {
        const next = current.filter((id) => id !== toolId);
        return next.length ? next : current;
      }
      return [...current, toolId];
    });
  }

  const buildPayload = useCallback(() => {
    const trimmedConteudo = conteudo.trim();
    const turma = school.turmaPayload;
    return {
      conteudo: trimmedConteudo || undefined,
      objetivo: objetivo.trim() || lessonBundleObjetivoHint,
      observacoes: observacoes.trim() || undefined,
      bundleTools: selectedTools,
      etapa: DEFAULT_MATERIAL_EDUCATION.etapa,
      anoSerie: DEFAULT_MATERIAL_EDUCATION.anoSerie,
      componenteCurricular:
        school.selectedClass?.discipline?.trim() ||
        DEFAULT_MATERIAL_EDUCATION.componente,
      componente:
        school.selectedClass?.discipline?.trim() ||
        DEFAULT_MATERIAL_EDUCATION.componente,
      quantidade: "10",
      dificuldade: "media",
      ...turma,
      discipline: school.selectedClass?.discipline?.trim() || undefined,
      disciplina: school.selectedClass?.discipline?.trim() || undefined,
    };
  }, [conteudo, objetivo, observacoes, selectedTools, school]);

  function upsertItemInList(nextItem: LessonBundleItem) {
    setItems((current) => {
      const index = current.findIndex((item) => item.toolId === nextItem.toolId);
      if (index === -1) return [...current, nextItem];
      const copy = [...current];
      copy[index] = nextItem;
      return copy;
    });
  }

  async function executarGeracao() {
    if (loading) return;

    setErro("");
    setErroCta(null);
    setErroRetryable(false);
    const trimmedConteudo = conteudo.trim();
    if (!trimmedConteudo) {
      setErro("Informe o conteúdo da aula.");
      return;
    }
    if (selectedTools.length === 0) {
      setErro("Selecione ao menos um material para o pacote.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setItems([]);
    setActiveTab(null);
    setShowPatienceMessage(false);
    setBundleSteps(initialBundleSteps(selectedTools));
    setProgressLabel("Preparando pacote…");
    loadingStartedAtRef.current = Date.now();

    const patienceTimer = window.setTimeout(() => {
      setShowPatienceMessage(true);
    }, PATIENCE_THRESHOLD_MS);

    try {
      const turma = school.turmaPayload;
      if (turma.className) {
        void school.rememberPersonalClass(turma.className);
      }

      const result = await requestLessonBundleGenerationStream(buildPayload(), {
        signal: controller.signal,
        onProgress: ({ index, total, toolId, status }) => {
          setBundleSteps((current) => ({
            ...current,
            [toolId]:
              status === "started"
                ? "running"
                : status === "done"
                  ? "done"
                  : "failed",
          }));
          if (status === "started") {
            setProgressLabel(progressLabelForTool(toolId, index, total));
          }
        },
        onItem: (item) => {
          upsertItemInList(item);
          if (item.ok && item.html) {
            persistBundleItemToHistory(item, {
              ...persistContext,
              tema: resolveMaterialDisplayTema("", trimmedConteudo),
            });
            setActiveTab((current) => current ?? item.toolId);
          }
        },
      });

      setItems(result.items);
      const firstOk = result.items.find((item) => item.ok && item.html);
      if (firstOk) setActiveTab(firstOk.toolId);
      setProgressLabel("");
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      window.clearTimeout(patienceTimer);
      setShowPatienceMessage(false);
      setLoading(false);
      loadingStartedAtRef.current = null;
    }
  }

  async function tentarNovamente(toolId: PlanifyToolId) {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);
    setRetryingToolId(toolId);
    setBundleSteps((current) => ({ ...current, [toolId]: "running" }));

    try {
      const completedItems = items.filter((item) => item.ok);
      const { item } = await requestLessonBundleItemRetry({
        ...buildPayload(),
        bundleRetry: true,
        toolId,
        completedItems,
      });

      upsertItemInList(item);
      setBundleSteps((current) => ({
        ...current,
        [toolId]: item.ok ? "done" : "failed",
      }));

      if (item.ok && item.html) {
        persistBundleItemToHistory(item, {
          ...persistContext,
          tema: resolveMaterialDisplayTema("", conteudo.trim()),
        });
        setActiveTab(toolId);
      }
    } catch (error) {
      setBundleSteps((current) => ({ ...current, [toolId]: "failed" }));
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    } finally {
      setRetryingToolId(null);
    }
  }

  function gerarPacote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executarGeracao();
  }

  function abrirNoEditor(item = activeItem) {
    if (!item?.html) return;
    const titulo = `${getPlanifyTool(item.toolId).shortTitle} — ${resolveMaterialDisplayTema("", conteudo) || "Aula"}`;
    openMaterialInEditor(item.html, titulo, {
      toolId: item.toolId,
      tema: resolveMaterialDisplayTema("", conteudo),
      componente:
        school.selectedClass?.discipline?.trim() ||
        DEFAULT_MATERIAL_EDUCATION.componente,
      anoSerie: DEFAULT_MATERIAL_EDUCATION.anoSerie,
      etapa: DEFAULT_MATERIAL_EDUCATION.etapa,
      pipeline: item.pipeline ?? null,
      qualityScore: item.qualityScore ?? null,
      qualityIssues: item.qualityIssues ?? [],
      serverMaterialId: item.materialId ?? null,
      estrutura: item.estrutura ?? null,
    }, { from: "aula-completa" });
  }

  const durationBadge = formatDurationEstimateBadge(estimatedDurationMs);

  const previewTabs = successItems.map((item) => ({
    id: item.toolId,
    label: getPlanifyTool(item.toolId).shortTitle,
    actions: (
      <button
        type="button"
        onClick={() => abrirNoEditor(item)}
        className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
      >
        Abrir no editor
      </button>
    ),
    content: item.html ? (
      <MaterialTypedPreview html={item.html} tipoMaterial={item.toolId} />
    ) : (
      <MaterialPreviewSkeleton />
    ),
  }));

  function fecharPainel() {
    if (studioMode && onStudioClose) {
      onStudioClose();
      return;
    }
    setModalAberto(false);
  }

  const activeItem = items.find((item) => item.toolId === activeTab && item.ok);

  function stepIcon(status: BundleStepStatus) {
    if (status === "running") {
      return (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
      );
    }
    if (status === "done") {
      return <PlanifyIcon name="checkCircle" className="h-4 w-4 text-emerald-600" />;
    }
    if (status === "failed") {
      return <PlanifyIcon name="alertCircle" className="h-4 w-4 text-rose-600" />;
    }
    return <span className="h-4 w-4 rounded-full border-2 border-slate-300" />;
  }

  const checklist = (
    <ul className="space-y-2 rounded-xl border border-cyan-400/20 bg-white/80 px-4 py-3">
      {orderedTools.map((toolId) => {
        const status = bundleSteps[toolId] ?? "pending";
        const failed = items.find((item) => item.toolId === toolId && !item.ok);
        const entry = lessonBundleTools.find((t) => t.id === toolId);
        return (
          <li key={toolId} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-800">
              {stepIcon(status)}
              {entry?.label ?? getPlanifyTool(toolId).shortTitle}
            </span>
            {status === "failed" || failed ? (
              <button
                type="button"
                disabled={retryingToolId === toolId || loading}
                onClick={() => void tentarNovamente(toolId)}
                className="text-xs font-bold text-cyan-700 underline disabled:opacity-50"
              >
                {retryingToolId === toolId ? "Regenerando…" : "Tentar novamente"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const painelCriacao = modalAberto ? (
    <MaterialToolPageShell
      tool={tool}
      studioMode={studioMode}
      onBack={fecharPainel}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={successItems.length > 0}
      previewLoading={loading}
      form={
        <form onSubmit={gerarPacote} className="space-y-4 pb-20 max-lg:pb-24">
          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="aula-conteudo">
              {formFields.conteudoLabel}
            </label>
            <textarea
              id="aula-conteudo"
              value={conteudo}
              onChange={(event) => setConteudo(event.target.value)}
              placeholder={formFields.conteudoPlaceholder}
              rows={4}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="aula-objetivo">
              Objetivo pedagógico
            </label>
            <textarea
              id="aula-objetivo"
              value={objetivo}
              onChange={(event) => setObjetivo(event.target.value)}
              rows={3}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <TurmaCombobox school={school} />

          <div>
            <p className={HUD_SECTION_LABEL}>Materiais do pacote</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {lessonBundleTools.map((entry) => {
                const active = selectedTools.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggleTool(entry.id)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-500 bg-cyan-50 shadow-sm"
                        : "border-cyan-400/20 bg-white hover:border-cyan-400/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <PlanifyIcon name={entry.icon} className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-slate-950">
                        {entry.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {entry.tag}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <GenerationCostHint
              creditCost={creditCost}
              deepSlotConsumed
              label="Pacote com desconto de 15% — custo:"
              className="mt-2"
            />
            <p className="mt-1 text-xs font-semibold text-cyan-700">
              {durationBadge} — não feche a aba
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Pacote essencial: plano, slides, atividade e lista. Acrescente itens opcionais só se precisar.
            </p>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="aula-obs">
              Observações (opcional)
            </label>
            <textarea
              id="aula-obs"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Metodologia preferida, tempo de aula, foco da turma…"
              rows={3}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <div className="hidden flex-col gap-2 lg:flex">
            <GenerationCostHint creditCost={creditCost} deepSlotConsumed />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {loading ? "Gerando pacote…" : "Gerar aula completa"}
              </button>
              <CreditsBalancePill />
            </div>
          </div>
          <DailyGenerationsBar />
          <GenerationErrorBanner
            message={erro}
            cta={erroCta}
            retryable={erroRetryable}
            onRetry={() => void executarGeracao()}
            retrying={loading}
          />

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cyan-400/20 bg-white/95 px-4 py-3 backdrop-blur lg:hidden pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="pl-hud-btn flex-1 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
              >
                {loading ? "Gerando pacote…" : "Gerar aula completa"}
              </button>
              <CreditsBalancePill />
            </div>
          </div>
        </form>
      }
      preview={
        <div className="space-y-4">
          {loading ? (
            <>
              <PlanifyOwlGenerationCoach
                active={loading}
                title={tool.loadingTitle}
                description={progressLabel || tool.loadingDescription}
                toolId="aula-completa"
                estimatedDurationMs={estimatedDurationMs}
              />
              <MaterialPreviewSkeleton />
              {checklist}
              {showPatienceMessage ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  Pacote grande em andamento — aguarde, não feche a aba.
                </p>
              ) : null}
            </>
          ) : successItems.length ? (
            <>
              {!loading && (failedItems.length > 0 || items.some((item) => !item.ok)) ? (
                <>
                  {checklist}
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    {successItems.length} de {orderedTools.length} prontos — regenere o item que falhou.
                  </p>
                </>
              ) : null}
              {successItems.length > 1 && activeTab ? (
                <SwipeTabPanel
                  tabs={previewTabs}
                  activeId={activeTab}
                  onChange={(id) => setActiveTab(id as PlanifyToolId)}
                />
              ) : activeItem?.html ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => abrirNoEditor()}
                      className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
                    >
                      Abrir no editor
                    </button>
                  </div>
                  <MaterialTypedPreview
                    html={activeItem.html}
                    tipoMaterial={activeItem.toolId}
                  />
                </>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-white/70 px-6 py-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                Aula completa
              </p>
              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Um fluxo, quatro entregas
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Informe o tema e gere plano, slides, atividade e avaliação alinhados
                no mesmo pacote.
              </p>
            </div>
          )}
        </div>
      }
    />
  ) : null;

  if (studioMode) return painelCriacao;

  return (
    <div className="space-y-4">
      {!modalAberto ? (
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          Montar aula completa
        </button>
      ) : null}
      {painelCriacao}
    </div>
  );
}
