"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { ToolStudioShell } from "@/components/studio/ToolStudioShell";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import { INCLUSAO_GENERATION_TYPE } from "@/lib/inclusao/inclusao-config";
import {
  INCLUSAO_EDUCATION_LEVELS,
  INCLUSAO_MODES,
  INCLUSAO_NEEDS,
  getInclusaoModeLabel,
  getInclusaoNeedLabel,
  type InclusaoEducationLevel,
  type InclusaoModeId,
  type InclusaoNeedId,
} from "@/lib/inclusao/inclusao-config";
import {
  requestInclusaoGeneration,
} from "@/lib/inclusao/inclusao-client";
import { getClientCreditCost } from "@/lib/credits/credit-costs";
import {
  dispatchCreditsChangedIfNeeded,
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
} from "@/lib/pro/generation-error-ui";
import { getPlanifyTool } from "@/lib/pro/planifyTools";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import {
  HUD_CHIP_INACTIVE,
  HUD_FIELD_CLASS,
  HUD_FILTER_CHIP_ACTIVE,
  HUD_FILTER_CHIP_INACTIVE,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";

type InclusaoClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
};

const tool = getPlanifyTool("inclusao");
const PATIENCE_THRESHOLD_MS = 60_000;

const MODE_CONTENT_LABELS: Record<InclusaoModeId, string> = {
  adaptacao: "Atividade ou plano original",
  trilhas: "Conteúdo base para as trilhas",
  relatorio: "Observações sobre o estudante",
  mediacao: "Material ou contexto (opcional)",
};

const MODE_CONTENT_PLACEHOLDERS: Record<InclusaoModeId, string> = {
  adaptacao:
    "Cole aqui a atividade, lista de exercícios ou plano de aula que deseja adaptar…",
  trilhas:
    "Cole o conteúdo que será trabalhado — a IA criará 2–3 níveis para a mesma turma…",
  relatorio:
    "Descreva comportamentos, participação, avanços e dificuldades observados em sala…",
  mediacao:
    "Cole material adaptado ou descreva a situação em sala (opcional para dicas gerais)…",
};

function buildExportTitle(
  mode: InclusaoModeId,
  need: InclusaoNeedId,
  level: InclusaoEducationLevel,
): string {
  return `Inclusão — ${getInclusaoModeLabel(mode)} — ${getInclusaoNeedLabel(need)} — ${level}`;
}

export function InclusaoClient({
  studioMode = false,
  onStudioClose,
}: InclusaoClientProps = {}) {
  const school = useSchoolClasses();
  const [modo, setModo] = useState<InclusaoModeId>("adaptacao");
  const [necessidade, setNecessidade] = useState<InclusaoNeedId>("tea");
  const [etapaEnsino, setEtapaEnsino] =
    useState<InclusaoEducationLevel>("EF I (1º ao 5º ano)");
  const [conteudo, setConteudo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [showPatienceMessage, setShowPatienceMessage] = useState(false);
  const patienceTimerRef = useRef<number | null>(null);
  const { runWithRetry, retrying: retryingGeneration } = useRetryableAction();
  const [resultadoHtml, setResultadoHtml] = useState("");
  const [resultadoMarkdown, setResultadoMarkdown] = useState("");
  const [modalAberto, setModalAberto] = useState(studioMode);

  const contentRequired = modo !== "mediacao";
  const exportTitle = useMemo(
    () => buildExportTitle(modo, necessidade, etapaEnsino),
    [modo, necessidade, etapaEnsino],
  );

  async function executarGeracao() {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);

    const trimmed = conteudo.trim();
    if (contentRequired && trimmed.length < 10) {
      setErro("Informe o conteúdo ou observações com pelo menos 10 caracteres.");
      return;
    }

    setLoading(true);
    setResultadoHtml("");
    setResultadoMarkdown("");
    setShowPatienceMessage(false);
    if (patienceTimerRef.current) {
      window.clearTimeout(patienceTimerRef.current);
    }
    patienceTimerRef.current = window.setTimeout(() => {
      setShowPatienceMessage(true);
    }, PATIENCE_THRESHOLD_MS);

    try {
      await runWithRetry(async () => {
        const turma = school.turmaPayload;
        if (turma.className) {
          void school.rememberPersonalClass(turma.className);
        }

        const result = await requestInclusaoGeneration({
          modo,
          necessidade,
          etapaEnsino,
          conteudo: trimmed,
          observacoes: observacoes.trim() || undefined,
          ...turma,
          discipline: school.selectedClass?.discipline?.trim() || undefined,
          disciplina: school.selectedClass?.discipline?.trim() || undefined,
        });

        setResultadoMarkdown(result.markdown);
        setResultadoHtml(result.html);
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
      setLoading(false);
    }
  }

  function gerarMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executarGeracao();
  }

  async function copiarResultado() {
    if (!resultadoMarkdown) return;

    try {
      await navigator.clipboard.writeText(resultadoMarkdown);
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  async function baixarPdf() {
    if (!resultadoHtml) {
      setErro("Gere um material antes de baixar.");
      return;
    }

    try {
      await downloadEditorExport({
        title: exportTitle,
        html: resultadoHtml,
        format: "pdf",
        fallbackFileName: `${exportTitle.replace(/[\\/:*?"<>|]/g, "-")}.pdf`,
      });
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta ?? null);
      setErroRetryable(formatted.retryable);
    }
  }

  function fecharPainel() {
    if (studioMode && onStudioClose) {
      onStudioClose();
      return;
    }
    setModalAberto(false);
  }

  function abrirPainel() {
    setModalAberto(true);
  }

  const painelCriacao = modalAberto ? (
    <ToolStudioShell
      tool={tool}
      onBack={fecharPainel}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={Boolean(resultadoHtml)}
      previewLoading={loading}
      form={
        <form onSubmit={gerarMaterial} className="space-y-4 max-lg:pb-2">
          <div>
            <p className={HUD_SECTION_LABEL}>Modo</p>
            <div className="flex flex-wrap gap-2">
              {INCLUSAO_MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModo(item.id)}
                  className={
                    modo === item.id ? HUD_FILTER_CHIP_ACTIVE : HUD_FILTER_CHIP_INACTIVE
                  }
                  title={item.description}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {INCLUSAO_MODES.find((m) => m.id === modo)?.description}
            </p>
          </div>

          <div>
            <p className={HUD_SECTION_LABEL}>Necessidade educacional</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {INCLUSAO_NEEDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNecessidade(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    necessidade === item.id
                      ? "border-cyan-500 bg-cyan-50 shadow-sm"
                      : "border-cyan-400/20 bg-white hover:border-cyan-400/40"
                  }`}
                >
                  <p className="text-sm font-extrabold text-slate-950">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="inclusao-etapa">
              Etapa de ensino
            </label>
            <select
              id="inclusao-etapa"
              value={etapaEnsino}
              onChange={(event) =>
                setEtapaEnsino(event.target.value as InclusaoEducationLevel)
              }
              className={HUD_FIELD_CLASS}
            >
              {INCLUSAO_EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="inclusao-conteudo">
              {MODE_CONTENT_LABELS[modo]}
              {!contentRequired ? " (opcional)" : ""}
            </label>
            <textarea
              id="inclusao-conteudo"
              value={conteudo}
              onChange={(event) => setConteudo(event.target.value)}
              placeholder={MODE_CONTENT_PLACEHOLDERS[modo]}
              rows={10}
              className={`${HUD_TEXTAREA_CLASS} min-h-[180px]`}
            />
          </div>

          {modo !== "relatorio" ? (
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="inclusao-obs">
                Observações adicionais (opcional)
              </label>
              <textarea
                id="inclusao-obs"
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Contexto da turma, recursos disponíveis, tempo de aula…"
                rows={3}
                className={HUD_TEXTAREA_CLASS}
              />
            </div>
          ) : null}

          <TurmaCombobox school={school} listId="inclusao-turma-suggestions" />

          <DailyGenerationsBar tipoMaterial={INCLUSAO_GENERATION_TYPE} compact />

          <GenerationCostHint
            creditCost={getClientCreditCost(INCLUSAO_GENERATION_TYPE)}
            className="mt-2"
          />

          <GenerationErrorBanner
            message={erro}
            cta={erroCta}
            retryable={erroRetryable}
            onRetry={() => void executarGeracao()}
            retrying={loading || retryingGeneration}
            className="mt-2"
          />

          <div className="hidden flex-wrap items-center gap-3 pt-1 lg:flex">
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlanifyIcon name="spark" className="h-4 w-4" />
              {loading ? "Adaptando…" : "Adaptar Material com IA"}
            </button>
            <CreditsBalancePill />
          </div>

          <MaterialToolMobileSubmitBar>
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn flex-1 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Adaptando…" : "Adaptar com IA"}
            </button>
            <CreditsBalancePill />
          </MaterialToolMobileSubmitBar>
        </form>
      }
      preview={
        <>
          {loading ? (
            <div className="space-y-4 p-2">
              <PlanifyOwlGenerationCoach
                active
                title={tool.loadingTitle}
                description={tool.loadingDescription}
                toolId="inclusao"
              />
              {showPatienceMessage ? (
                <p className="text-center text-sm font-semibold text-slate-600">
                  A adaptação inclusiva pode levar alguns minutos. Não feche esta página.
                </p>
              ) : null}
              <MaterialPreviewSkeleton />
            </div>
          ) : resultadoHtml ? (
            <div>
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void copiarResultado()}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  Copiar
                </button>
                <button
                  type="button"
                  onClick={() => void baixarPdf()}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <PlanifyIcon name="download" className="h-4 w-4" />
                  Baixar PDF
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
              </div>
              <MaterialTypedPreview html={resultadoHtml} tipoMaterial="inclusao" />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-8 text-center">
              <PlanifyOwlMark size={72} glow />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Pré-visualização
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">
                Inclusão escolar com IA
              </h3>
              <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                Selecione o modo, a necessidade e cole o conteúdo. O resultado
                aparece aqui com opções de copiar e baixar PDF.
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
    <PlanifyWorkspacePane>
      <div className="planify-hud pl-hud-hub mx-auto max-w-6xl space-y-5">
        {!modalAberto ? (
          <section className="pl-hud-glass rounded-2xl p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Inclusão escolar
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              {tool.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600">
              {tool.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {INCLUSAO_MODES.map((item) => (
                <span
                  key={item.id}
                  className={HUD_CHIP_INACTIVE}
                >
                  {item.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={abrirPainel}
              className="pl-hud-btn mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
            >
              <PlanifyIcon name="spark" className="h-4 w-4" />
              Abrir ferramenta
            </button>
          </section>
        ) : (
          painelCriacao
        )}
      </div>
    </PlanifyWorkspacePane>
  );
}
