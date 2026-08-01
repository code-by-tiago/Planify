"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialBnccSkillsPanel } from "@/components/bncc/MaterialBnccSkillsPanel";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { DailyGenerationsBar } from "@/components/credits/DailyGenerationsBar";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { GoogleDocumentExportBar } from "@/components/google/GoogleDocumentExportBar";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialTypedPreview } from "@/components/materiais/preview/MaterialTypedPreview";
import { MaterialToolMobileSubmitBar } from "@/components/pro/MaterialToolMobileSubmitBar";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import { PlanifyWorkspacePane } from "@/components/pro/PlanifyWorkspacePane";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import { useBnccContentSkillsSuggestion } from "@/hooks/useBnccContentSkillsSuggestion";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import {
  mapSelectedBnccSkillsToPayload,
  splitTopicLines,
  validateSelectedBnccSkillsForStage,
} from "@/lib/bncc/bncc-suggestion-ui";
import { downloadEditorExport } from "@/lib/downloads/editor-export-client";
import {
  EDUCATION_STAGES,
  getYearOptions,
  type EducationStage,
} from "@/lib/educacao/education-options";
import {
  openMaterialInEditor,
  persistGeneratedMaterial,
  type MaterialEditorMeta,
} from "@/lib/materiais/material-editor-flow";
import { requestPeiGeneration } from "@/lib/pei/pei-client";
import {
  getPeiCidOptions,
  getPeiDisciplineOption,
  PEI_CID_OPTIONS,
  PEI_DISCIPLINE_OPTIONS,
  PEI_GENERATION_TYPE,
  PEI_TRIMESTER_OPTIONS,
  type PeiGenerationRequest,
  type PeiGenerationResult,
  type PeiTrimestre,
} from "@/lib/pei/pei-options";
import { getClientCreditCost } from "@/lib/credits/credit-costs";
import {
  formatGenerationError,
  GenerationErrorBanner,
  useRetryableAction,
} from "@/lib/pro/generation-error-ui";
import {
  HUD_FIELD_CLASS,
  HUD_SCROLLABLE_TEXTAREA_CLASS,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";
import { getPlanifyTool } from "@/lib/pro/planifyTools";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";

type PeiClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
  initialTema?: string;
};

const tool = getPlanifyTool("pei");
const PATIENCE_THRESHOLD_MS = 60_000;

function getDefaultDiscipline() {
  return PEI_DISCIPLINE_OPTIONS[0];
}

function buildExportTitle(result: PeiGenerationResult | null, disciplina: string, estudante: string) {
  if (result?.title) return result.title;
  const cleanStudent = estudante.trim();
  return cleanStudent ? `PEI - ${disciplina} - ${cleanStudent}` : `PEI - ${disciplina}`;
}

function addUnique(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return list;
  if (list.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    return list;
  }
  return [...list, trimmed];
}

export function PeiClient({
  studioMode = false,
  onStudioClose,
  initialTema = "",
}: PeiClientProps = {}) {
  const school = useSchoolClasses();
  const initialDiscipline = getDefaultDiscipline();
  const [modalAberto, setModalAberto] = useState(studioMode);
  const [estudanteNome, setEstudanteNome] = useState(initialTema);
  const [dataNascimento, setDataNascimento] = useState("");
  const [etapa, setEtapa] = useState<EducationStage>("Ensino Médio");
  const [anoSerie, setAnoSerie] = useState("1ª série");
  const [turno, setTurno] = useState("");
  const [professorRegente, setProfessorRegente] = useState("");
  const [professorAee, setProfessorAee] = useState("");
  const [disciplina, setDisciplina] = useState(initialDiscipline.value);
  const [areaConhecimento, setAreaConhecimento] = useState(initialDiscipline.area);
  const [selectedCids, setSelectedCids] = useState<string[]>([
    PEI_CID_OPTIONS[0]?.codigo ?? "F84.0",
  ]);
  const [cidDraft, setCidDraft] = useState(PEI_CID_OPTIONS[0]?.codigo ?? "F84.0");
  const [trimestre, setTrimestre] = useState<PeiTrimestre>("todos");
  const [conteudos, setConteudos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [gerarParecer, setGerarParecer] = useState(true);
  const [resultado, setResultado] = useState<PeiGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [showPatienceMessage, setShowPatienceMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const patienceTimerRef = useRef<number | null>(null);
  const conteudosRef = useRef(conteudos);
  const { runWithRetry, retrying: retryingGeneration } = useRetryableAction();

  useEffect(() => {
    conteudosRef.current = conteudos;
  }, [conteudos]);

  const bnccBasePayload = useMemo(
    () => ({
      etapa,
      anoSerie,
      areaConhecimento,
      componenteCurricular: disciplina,
    }),
    [anoSerie, areaConhecimento, disciplina, etapa],
  );

  const handleBnccError = useCallback((message: string) => {
    if (message) {
      setErro(message);
    } else {
      setErro("");
    }
  }, []);

  const {
    groups: bnccGroups,
    selectedSkills,
    loadingBncc,
    refreshingConteudo,
    suggestBncc,
    refreshContentBncc,
    toggleSkill,
    selectGroup,
    clearGroup,
    clearAll: clearBnccSelection,
    reset: resetBncc,
  } = useBnccContentSkillsSuggestion({
    basePayload: bnccBasePayload,
    getConteudosText: () => conteudosRef.current,
    onError: handleBnccError,
  });

  const yearOptions = useMemo(() => getYearOptions(etapa), [etapa]);
  const conteudosPreenchido = Boolean(conteudos.trim());
  const bnccReady = Boolean(etapa && anoSerie && disciplina && conteudosPreenchido);
  const selectedCidOptions = useMemo(
    () => getPeiCidOptions(selectedCids),
    [selectedCids],
  );
  const exportTitle = useMemo(
    () => buildExportTitle(resultado, disciplina, estudanteNome),
    [disciplina, estudanteNome, resultado],
  );

  useEffect(() => {
    if (!yearOptions.includes(anoSerie)) {
      setAnoSerie(yearOptions[0] || "");
    }
  }, [anoSerie, yearOptions]);

  useEffect(() => {
    resetBncc();
  }, [etapa, anoSerie, disciplina, resetBncc]);

  function updateDiscipline(next: string) {
    const discipline = getPeiDisciplineOption(next);
    setDisciplina(discipline.value);
    setAreaConhecimento(discipline.area);
  }

  function addCid() {
    setSelectedCids((current) => addUnique(current, cidDraft));
  }

  function removeCid(codigo: string) {
    setSelectedCids((current) => {
      const next = current.filter((item) => item !== codigo);
      return next.length ? next : current;
    });
  }

  function buildPayload(): PeiGenerationRequest {
    const turma = school.turmaPayload;
    const idempotencyKey = crypto.randomUUID();
    return {
      estudanteNome: estudanteNome.trim() || undefined,
      dataNascimento: dataNascimento || undefined,
      etapa,
      anoSerie,
      turma: turma.turma ?? null,
      turno: turno.trim() || undefined,
      professorRegente: professorRegente.trim() || undefined,
      professorAee: professorAee.trim() || undefined,
      disciplina,
      areaConhecimento,
      cid: selectedCids[0] ?? "",
      cids: selectedCids,
      conteudos: splitTopicLines(conteudos),
      habilidadesSelecionadas: mapSelectedBnccSkillsToPayload(selectedSkills, {
        etapa,
        anoSerie,
        areaConhecimento,
        componente: disciplina,
      }),
      trimestre,
      observacoes: observacoes.trim() || undefined,
      gerarParecer,
      idempotencyKey,
      ...turma,
      discipline: school.selectedClass?.discipline?.trim() || disciplina,
      disciplinaContexto: school.selectedClass?.discipline?.trim() || disciplina,
    };
  }

  function buildMeta(payload: PeiGenerationRequest, result: PeiGenerationResult): MaterialEditorMeta {
    return {
      toolId: "pei",
      tema: result.title,
      componente: disciplina,
      anoSerie,
      etapa,
      areaConhecimento,
      pipeline: result.pipeline,
      qualityScore: result.qualityScore,
      qualityIssues: result.alertas,
      generationPayload: payload as unknown as MaterialEngineInput,
      serverMaterialId: result.materialId ?? null,
    };
  }

  async function executarGeracao() {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);
    setCopied(false);

    if (!anoSerie.trim()) {
      setErro("Informe o ano ou série do estudante.");
      return;
    }
    if (!selectedCids.length) {
      setErro("Selecione ao menos um CID ou perfil educacional.");
      return;
    }
    if (!conteudosPreenchido) {
      setErro("Informe ao menos um conteúdo na caixa Conteúdos.");
      return;
    }
    if (!selectedSkills.length) {
      setErro("Sugira e selecione ao menos uma habilidade BNCC compatível.");
      return;
    }
    const stageError = validateSelectedBnccSkillsForStage(selectedSkills, etapa, anoSerie);
    if (stageError) {
      setErro(stageError);
      return;
    }

    setLoading(true);
    setResultado(null);
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

        const payload = buildPayload();
        const result = await requestPeiGeneration(payload);
        if (!result.html.trim()) {
          throw new Error("A geração concluiu, mas não retornou HTML.");
        }

        setResultado(result);
        persistGeneratedMaterial(result.html, result.title, buildMeta(payload, result));
      });
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta);
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void executarGeracao();
  }

  function abrirNoEditor() {
    if (!resultado) return;
    const payload = buildPayload();
    openMaterialInEditor(resultado.html, resultado.title, buildMeta(payload, resultado), {
      from: "pei",
    });
  }

  async function copiarParecer() {
    if (!resultado?.parecer) return;
    try {
      await navigator.clipboard.writeText(resultado.parecer);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setErro("Não foi possível copiar o parecer.");
    }
  }

  async function baixarPdf() {
    if (!resultado?.html) return;
    try {
      await downloadEditorExport({
        title: exportTitle,
        html: resultado.html,
        format: "pdf",
        documentType: "material:pei",
      });
    } catch (error) {
      const formatted = formatGenerationError(error);
      setErro(formatted.message);
      setErroCta(formatted.cta);
      setErroRetryable(formatted.retryable);
    }
  }

  const painelCriacao = modalAberto ? (
    <MaterialToolPageShell
      tool={tool}
      studioMode={studioMode}
      onBack={studioMode ? onStudioClose : () => setModalAberto(false)}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      previewReady={Boolean(resultado)}
      previewLoading={loading}
      form={
        <form onSubmit={handleSubmit} className="space-y-4 max-lg:pb-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-estudante">
                Nome do estudante
              </label>
              <input
                id="pei-estudante"
                value={estudanteNome}
                onChange={(event) => setEstudanteNome(event.target.value)}
                className={HUD_FIELD_CLASS}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-nascimento">
                Data de nascimento
              </label>
              <input
                id="pei-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(event.target.value)}
                className={HUD_FIELD_CLASS}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-etapa">
                Etapa
              </label>
              <select
                id="pei-etapa"
                value={etapa}
                onChange={(event) => setEtapa(event.target.value as EducationStage)}
                className={HUD_FIELD_CLASS}
              >
                {EDUCATION_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-ano">
                Ano / série
              </label>
              <select
                id="pei-ano"
                value={anoSerie}
                onChange={(event) => setAnoSerie(event.target.value)}
                className={HUD_FIELD_CLASS}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-turno">
                Turno
              </label>
              <select
                id="pei-turno"
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className={HUD_FIELD_CLASS}
              >
                <option value="">A preencher</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Noturno">Noturno</option>
                <option value="Integral">Integral</option>
              </select>
            </div>
          </div>

          <TurmaCombobox school={school} listId="pei-turma-suggestions" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-professor-regente">
                Professor regente
              </label>
              <input
                id="pei-professor-regente"
                value={professorRegente}
                onChange={(event) => setProfessorRegente(event.target.value)}
                className={HUD_FIELD_CLASS}
                placeholder="Nome do professor"
              />
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-professor-aee">
                Professor AEE/SRM
              </label>
              <input
                id="pei-professor-aee"
                value={professorAee}
                onChange={(event) => setProfessorAee(event.target.value)}
                className={HUD_FIELD_CLASS}
                placeholder="Nome do profissional"
              />
            </div>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="pei-cid">
              CID / perfil educacional
            </label>
            <div className="flex gap-2">
              <select
                id="pei-cid"
                value={cidDraft}
                onChange={(event) => setCidDraft(event.target.value)}
                className={HUD_FIELD_CLASS}
              >
                {PEI_CID_OPTIONS.map((option) => (
                  <option key={option.codigo} value={option.codigo}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addCid}
                className="pl-hud-btn-secondary inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold"
              >
                <PlanifyIcon name="plus" className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCidOptions.map((option) => (
                <button
                  type="button"
                  key={option.codigo}
                  onClick={() => removeCid(option.codigo)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-cyan-400/25 bg-white px-3 py-1.5 text-left text-xs font-bold text-slate-700"
                  title="Remover CID"
                >
                  <span className="line-clamp-1">{option.label}</span>
                  <PlanifyIcon name="close" className="h-3.5 w-3.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-disciplina">
                Disciplina
              </label>
              <select
                id="pei-disciplina"
                value={disciplina}
                onChange={(event) => updateDiscipline(event.target.value)}
                className={HUD_FIELD_CLASS}
              >
                {PEI_DISCIPLINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={HUD_SECTION_LABEL} htmlFor="pei-trimestre">
                Trimestre
              </label>
              <select
                id="pei-trimestre"
                value={trimestre}
                onChange={(event) => setTrimestre(event.target.value as PeiTrimestre)}
                className={HUD_FIELD_CLASS}
              >
                {PEI_TRIMESTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="pei-conteudos">
              Conteúdos
            </label>
            <textarea
              id="pei-conteudos"
              value={conteudos}
              onChange={(event) => setConteudos(event.target.value)}
              rows={6}
              spellCheck={false}
              placeholder="Descreva os conteúdos ou unidades que deseja trabalhar no PEI."
              className={HUD_SCROLLABLE_TEXTAREA_CLASS}
              aria-describedby="pei-conteudos-hint"
            />
            <p
              id="pei-conteudos-hint"
              className="mt-2 text-xs text-cyan-700/80"
            >
              Texto livre — use o formato que preferir. A IA e a BNCC interpretam o conteúdo
              informado sem reorganizar automaticamente este campo.
              {conteudosPreenchido ? " (preenchido)" : ""}
            </p>
          </div>

          <MaterialBnccSkillsPanel
            groups={bnccGroups}
            selectedSkills={selectedSkills}
            loading={loadingBncc}
            temaReady={bnccReady}
            notReadyHint="Preencha etapa, ano/série, disciplina e conteúdos acima para buscar habilidades compatíveis."
            title="Habilidades BNCC por conteúdo"
            description="As sugestões vêm desmarcadas por padrão. Se não concordar com as opções de um conteúdo, use Atualizar habilidades naquele bloco. Selecione as habilidades que entrarão no PEI."
            suggestButtonLabel={loadingBncc ? "Sugerindo BNCC..." : "Sugerir BNCC"}
            emptyStateHint="Nenhuma sugestão ainda. Preencha os conteúdos e clique em Sugerir BNCC."
            onSuggest={() => void suggestBncc()}
            onToggleSkill={toggleSkill}
            onSelectGroup={selectGroup}
            onClearGroup={clearGroup}
            onClearAll={clearBnccSelection}
            onRefreshGroup={(group) => void refreshContentBncc(group)}
            refreshingConteudo={refreshingConteudo}
          />

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="pei-observacoes">
              Observações complementares
            </label>
            <textarea
              id="pei-observacoes"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              rows={3}
              className={HUD_TEXTAREA_CLASS}
              placeholder="Contexto da escola, articulações, combinados com família ou equipe..."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={gerarParecer}
              onChange={(event) => setGerarParecer(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600"
            />
            Gerar parecer pedagógico individualizado
          </label>

          <DailyGenerationsBar tipoMaterial={PEI_GENERATION_TYPE} compact />

          <GenerationCostHint
            creditCost={getClientCreditCost(PEI_GENERATION_TYPE)}
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
              {loading ? "Gerando PEI..." : "Gerar PEI com IA"}
            </button>
            <CreditsBalancePill />
          </div>

          <MaterialToolMobileSubmitBar>
            <button
              type="submit"
              disabled={loading}
              className="pl-hud-btn flex-1 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-60"
            >
              {loading ? "Gerando..." : "Gerar PEI"}
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
                toolId={PEI_GENERATION_TYPE}
              />
              {showPatienceMessage ? (
                <p className="text-center text-sm font-semibold text-slate-600">
                  O PEI pode levar alguns minutos para ficar consistente. Não feche esta página.
                </p>
              ) : null}
              <MaterialPreviewSkeleton />
            </div>
          ) : resultado ? (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={abrirNoEditor}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <PlanifyIcon name="editor" className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void baixarPdf()}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                >
                  <PlanifyIcon name="download" className="h-4 w-4" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => void executarGeracao()}
                  disabled={loading}
                  className="pl-hud-btn-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60"
                >
                  <PlanifyIcon name="spark" className="h-4 w-4" />
                  Regenerar
                </button>
                <GoogleDocumentExportBar
                  title={exportTitle}
                  getHtml={() => resultado.html}
                  documentType="material:pei"
                  returnTo="/dashboard?tipo=pei"
                  compact
                  classroomMode="popover"
                  disabled={!resultado.html}
                />
              </div>

              {resultado.alertas.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {resultado.alertas[0]}
                </div>
              ) : null}

              {gerarParecer && resultado.parecer ? (
                <section className="rounded-2xl border border-cyan-400/20 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                        Parecer do aluno
                      </p>
                      <h3 className="mt-1 text-sm font-extrabold text-slate-950">
                        Parecer pedagógico individualizado
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copiarParecer()}
                      className="pl-hud-btn-secondary rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
                    {resultado.parecer}
                  </p>
                </section>
              ) : null}

              <MaterialTypedPreview html={resultado.html} tipoMaterial={PEI_GENERATION_TYPE} />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-4 py-8 text-center">
              <PlanifyOwlMark size={72} glow />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                PEI
              </p>
              <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                Documento institucional com parecer lateral
              </h3>
              <div className="mt-4 max-w-md rounded-2xl border border-cyan-400/20 bg-white/80 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Referência atual
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {selectedCidOptions.map((option) => option.label).join("; ")}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {areaConhecimento} - {disciplina}
                </p>
              </div>
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
              Educação inclusiva
            </p>
            <h1 className="mt-2 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
              {tool.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-slate-600">
              {tool.description}
            </p>
            <button
              type="button"
              onClick={() => setModalAberto(true)}
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
