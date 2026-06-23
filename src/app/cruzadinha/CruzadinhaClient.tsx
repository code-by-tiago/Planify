"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import {
  buildCruzadinhaGenerationPayload,
  requestCruzadinhaGeneration,
} from "@/lib/cruzadinha/cruzadinha-generation-client";
import {
  openMaterialInEditor,
  type MaterialEditorMeta,
} from "@/lib/materiais/material-editor-flow";
import {
  CRUZADINHA_DIFFICULTY_OPTIONS,
  CRUZADINHA_GENERATION_TYPE,
  type CruzadinhaDifficulty,
} from "@/lib/cruzadinha/cruzadinha-config";
import {
  DEFAULT_MATERIAL_EDUCATION,
  educationDefaultsForTool,
  normalizeMaterialEducation,
} from "@/lib/educacao/education-options";
import {
  defaultQuantityForTool,
  getQuantityPresets,
} from "@/lib/educacao/material-quantity-presets";
import { toolSupportsGabarito, getMaterialFormFieldConfig, hasMaterialTopicInput, resolveMaterialDisplayTema } from "@/lib/educacao/material-form-config";
import {
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
} from "@/lib/pro/generation-error-ui";
import { getPlanifyTool } from "@/lib/pro/planifyTools";
import { useBnccEducationOptions } from "@/hooks/useBnccEducationOptions";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";

type CruzadinhaClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
  initialTema?: string;
};

const tool = getPlanifyTool("cruzadinha");
const formFields = getMaterialFormFieldConfig("cruzadinha");
const PATIENCE_THRESHOLD_MS = 60_000;

function buildExportTitle(tema: string, conteudo: string): string {
  const clean = resolveMaterialDisplayTema(tema, conteudo) || "Cruzadinha";
  return `Cruzadinha — ${clean}`;
}

export function CruzadinhaClient({
  studioMode = false,
  onStudioClose,
  initialTema = "",
}: CruzadinhaClientProps = {}) {
  const school = useSchoolClasses();
  const defaults = useMemo(
    () => educationDefaultsForTool("cruzadinha", DEFAULT_MATERIAL_EDUCATION),
    [],
  );

  const [etapa, setEtapa] = useState(defaults.etapa);
  const [anoSerie, setAnoSerie] = useState(defaults.anoSerie);
  const [areaConhecimento, setAreaConhecimento] = useState(
    defaults.areaConhecimento,
  );
  const [componente, setComponente] = useState(defaults.componente);
  const [tema, setTema] = useState(initialTema);
  const [conteudo, setConteudo] = useState("");
  const [quantidade, setQuantidade] = useState(
    defaultQuantityForTool("cruzadinha"),
  );
  const [dificuldade, setDificuldade] = useState<CruzadinhaDifficulty>("media");
  const [palavrasOpcionais, setPalavrasOpcionais] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<
    ReturnType<typeof formatGenerationError>["cta"]
  >(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [showPatienceMessage, setShowPatienceMessage] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [openingEditor, setOpeningEditor] = useState(false);
  const patienceTimerRef = useRef<number | null>(null);
  const editorOpenedRef = useRef(false);
  const { runWithRetry, retrying: retryingGeneration } = useRetryableAction();
  const [resultadoHtml, setResultadoHtml] = useState("");
  const [modalAberto, setModalAberto] = useState(studioMode);

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

  const quantityPresets = useMemo(
    () => getQuantityPresets("cruzadinha"),
    [],
  );
  const exportTitle = useMemo(
    () => buildExportTitle(tema, conteudo),
    [tema, conteudo],
  );
  const showGabarito = toolSupportsGabarito("cruzadinha");

  async function executarGeracao() {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);

    const trimmedTema = tema.trim();
    const trimmedConteudo = conteudo.trim();
    if (!hasMaterialTopicInput(trimmedTema, trimmedConteudo)) {
      setErro("Informe o conteúdo ou o tema da cruzadinha.");
      return;
    }
    if (!anoSerie.trim()) {
      setErro("Informe o ano/série para adequar as pistas.");
      return;
    }
    if (!componente.trim()) {
      setErro("Informe o componente curricular.");
      return;
    }

    setLoading(true);
    editorOpenedRef.current = false;
    setOpeningEditor(false);
    setResultadoHtml("");
    setProgressLabel("");
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

        const idempotencyKey = crypto.randomUUID();
        const generationInput = {
          tema: trimmedTema || undefined,
          conteudo: trimmedConteudo || undefined,
          etapa,
          anoSerie,
          componenteCurricular: componente,
          areaConhecimento,
          quantidade,
          dificuldade,
          palavrasOpcionais: palavrasOpcionais.trim() || undefined,
          observacoes: observacoes.trim() || undefined,
          incluirGabarito: showGabarito && incluirGabarito,
          ...turma,
          discipline: school.selectedClass?.discipline?.trim() || componente,
          disciplina: school.selectedClass?.discipline?.trim() || componente,
          idempotencyKey,
        };

        const result = await requestCruzadinhaGeneration(
          generationInput,
          {
            onProgress: ({ message }) => setProgressLabel(message),
          },
        );

        if (!result.html?.trim()) {
          throw new Error("A geração concluiu, mas não retornou HTML.");
        }

        const titulo = buildExportTitle(trimmedTema, trimmedConteudo);
        const meta: MaterialEditorMeta = {
          toolId: "cruzadinha",
          tema: resolveMaterialDisplayTema(trimmedTema, trimmedConteudo),
          componente,
          anoSerie,
          etapa,
          areaConhecimento,
          qualityScore: result.qualityScore ?? null,
          qualityIssues: result.qualityIssues ?? [],
          generationPayload: buildCruzadinhaGenerationPayload(generationInput),
          serverMaterialId: result.materialId ?? null,
        };

        editorOpenedRef.current = true;
        setOpeningEditor(true);
        openMaterialInEditor(result.html, titulo, meta, { from: "cruzadinha" });
        return;
      });
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta);
      setErroRetryable(formatted.retryable);
    } finally {
      if (patienceTimerRef.current) {
        window.clearTimeout(patienceTimerRef.current);
      }
      if (!editorOpenedRef.current) {
        setLoading(false);
      }
    }
  }

  async function baixarPdf() {
    if (!resultadoHtml.trim()) return;
    await downloadEditorExport({
      title: exportTitle,
      html: resultadoHtml,
      format: "pdf",
      documentType: "material:cruzadinha",
    });
  }

  function abrirPainel() {
    setModalAberto(true);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void executarGeracao();
  }

  const painelCriacao = modalAberto ? (
    <MaterialToolPageShell
      tool={tool}
      studioMode={studioMode}
      onBack={studioMode ? onStudioClose : () => setModalAberto(false)}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={loading || openingEditor}
      previewLoading={loading}
      form={
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cruzadinha-conteudo" className={HUD_SECTION_LABEL}>
              {formFields.conteudoLabel}
            </label>
            <textarea
              id="cruzadinha-conteudo"
              value={conteudo}
              onChange={(event) => setConteudo(event.target.value)}
              placeholder={formFields.conteudoPlaceholder}
              rows={4}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <div>
            <label htmlFor="cruzadinha-tema" className={HUD_SECTION_LABEL}>
              {formFields.temaLabel}
            </label>
            <input
              id="cruzadinha-tema"
              value={tema}
              onChange={(event) => setTema(event.target.value)}
              placeholder="Ex.: Sistema Solar, Revolução Industrial, Frações…"
              className={HUD_FIELD_CLASS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cruzadinha-etapa" className={HUD_SECTION_LABEL}>
                Etapa
              </label>
              <select
                id="cruzadinha-etapa"
                value={etapa}
                onChange={(event) =>
                  applyEducation(
                    normalizeMaterialEducation(educationFields, {
                      etapa: event.target.value,
                    }),
                  )
                }
                className={HUD_FIELD_CLASS}
              >
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cruzadinha-ano" className={HUD_SECTION_LABEL}>
                Ano / série
              </label>
              <select
                id="cruzadinha-ano"
                value={anoSerie}
                onChange={(event) =>
                  applyEducation(
                    normalizeMaterialEducation(educationFields, {
                      anoSerie: event.target.value,
                    }),
                  )
                }
                className={HUD_FIELD_CLASS}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cruzadinha-area" className={HUD_SECTION_LABEL}>
                Área do conhecimento
              </label>
              <select
                id="cruzadinha-area"
                value={areaConhecimento}
                onChange={(event) =>
                  applyEducation(
                    normalizeMaterialEducation(educationFields, {
                      areaConhecimento: event.target.value,
                    }),
                  )
                }
                className={HUD_FIELD_CLASS}
              >
                {areaOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cruzadinha-componente" className={HUD_SECTION_LABEL}>
                Componente
              </label>
              <select
                id="cruzadinha-componente"
                value={componente}
                onChange={(event) => setComponente(event.target.value)}
                className={HUD_FIELD_CLASS}
              >
                {componentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="cruzadinha-quantidade" className={HUD_SECTION_LABEL}>
              Quantidade de palavras
            </label>
            <select
              id="cruzadinha-quantidade"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              className={HUD_FIELD_CLASS}
            >
              {quantityPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cruzadinha-dificuldade" className={HUD_SECTION_LABEL}>
              Dificuldade
            </label>
            <select
              id="cruzadinha-dificuldade"
              value={dificuldade}
              onChange={(event) =>
                setDificuldade(event.target.value as CruzadinhaDifficulty)
              }
              className={HUD_FIELD_CLASS}
            >
              {CRUZADINHA_DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cruzadinha-palavras" className={HUD_SECTION_LABEL}>
              Palavras opcionais
            </label>
            <textarea
              id="cruzadinha-palavras"
              value={palavrasOpcionais}
              onChange={(event) => setPalavrasOpcionais(event.target.value)}
              placeholder="Separe por vírgula ou linha — a IA tentará incluir termos do tema que você indicar."
              rows={2}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <div>
            <label htmlFor="cruzadinha-obs" className={HUD_SECTION_LABEL}>
              Observações (opcional)
            </label>
            <textarea
              id="cruzadinha-obs"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              placeholder="Ex.: linguagem simples, foco em vocabulário da unidade, tempo de aula de 40 min…"
              rows={2}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          {showGabarito ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={incluirGabarito}
                onChange={(event) => setIncluirGabarito(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600"
              />
              Incluir gabarito do professor
            </label>
          ) : null}

          <TurmaCombobox school={school} listId="cruzadinha-turma-suggestions" />

          <GenerationErrorBanner
            message={erro}
            cta={erroCta}
            retryable={erroRetryable}
            onRetry={() => void executarGeracao()}
            retrying={loading || retryingGeneration}
            className="mt-2"
          />

          <div className="hidden pt-1 lg:block">
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlanifyIcon name="spark" className="h-4 w-4" />
              {loading ? "Gerando cruzadinha…" : "Gerar Cruzadinha com IA"}
            </button>
          </div>

          <MaterialToolMobileSubmitBar>
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn flex-1 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Gerando…" : "Gerar com IA"}
            </button>
          </MaterialToolMobileSubmitBar>
        </form>
      }
      preview={
        <>
          {loading ? (
            <div className="space-y-4 p-2">
              <PlanifyOwlGenerationCoach
                active
                title={
                  openingEditor
                    ? "Salvando e abrindo no editor"
                    : tool.loadingTitle
                }
                description={
                  openingEditor
                    ? "O material foi salvo em Meus materiais. Redirecionando para o editor…"
                    : progressLabel || tool.loadingDescription
                }
                toolId={CRUZADINHA_GENERATION_TYPE}
              />
              {!openingEditor && showPatienceMessage ? (
                <p className="text-center text-sm font-semibold text-slate-600">
                  A montagem da grade pode levar alguns instantes. Não feche esta
                  página.
                </p>
              ) : null}
              <MaterialPreviewSkeleton />
            </div>
          ) : resultadoHtml ? (
            <div>
              <div className="mb-4 flex flex-wrap justify-end gap-2">
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
                <GoogleDocumentExportBar
                  title={exportTitle}
                  getHtml={() => resultadoHtml}
                  documentType="material:cruzadinha"
                  returnTo="/dashboard?tipo=cruzadinha"
                  compact
                  classroomMode="popover"
                  disabled={!resultadoHtml}
                />
              </div>
              <MaterialTypedPreview
                html={resultadoHtml}
                tipoMaterial={CRUZADINHA_GENERATION_TYPE}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-8 text-center">
              <PlanifyOwlMark size={72} glow />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                Pré-visualização
              </p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">
                Cruzadinha pronta para imprimir
              </h3>
              <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                Informe o tema e a turma. A grade visual com pistas aparece aqui
                — exporte em PDF ou envie ao Google Classroom.
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
              Engajar alunos
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
              {tool.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600">
              {tool.description}
            </p>
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
