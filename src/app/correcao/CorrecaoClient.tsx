"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditsBalancePill } from "@/components/credits/CreditsBalancePill";
import { GenerationCostHint } from "@/components/credits/GenerationCostHint";
import { MaterialPreviewSkeleton } from "@/components/materiais/MaterialPreviewSkeleton";
import { MaterialToolPageShell } from "@/components/pro/MaterialToolPageShell";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { getClientCreditCost } from "@/lib/credits/credit-costs";
import {
  dispatchCreditsChangedIfNeeded,
  formatGenerationError,
  GenerationErrorBanner,
} from "@/lib/pro/generation-error-ui";
import { PlanifyOwlGenerationCoach } from "@/components/pro/PlanifyOwlGenerationCoach";
import {
  requestBatchCorrection,
  requestCorrection,
} from "@/lib/correcao/correcao-client";
import {
  extractTextFromUpload,
  splitMultiStudentText,
} from "@/lib/correcao/correcao-ocr-client";
import {
  learnFromCorrectionFeedback,
  loadTeacherCorrectionProfile,
  saveTeacherCorrectionProfile,
  syncTeacherCorrectionProfileFromServer,
} from "@/lib/correcao/correction-storage";
import { getPlanifyTool } from "@/lib/pro/planifyTools";
import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import { TurmaCombobox } from "@/components/school/TurmaCombobox";
import type { CorrectionAiOutput, CorrectionRigor, CorrectionTone } from "@/types/correction";
import {
  HUD_FIELD_CLASS,
  HUD_FILTER_CHIP_ACTIVE,
  HUD_FILTER_CHIP_INACTIVE,
  HUD_SECTION_LABEL,
  HUD_TEXTAREA_CLASS,
} from "@/lib/pro/hud-form-styles";

type CorrecaoClientProps = {
  studioMode?: boolean;
  onStudioClose?: () => void;
  /** Abre direto na aba de upload (foto/PDF). */
  initialInputMode?: InputMode;
};

type InputMode = "paste" | "upload";

function resolveInitialInputMode(
  searchParams: ReturnType<typeof useSearchParams>,
  propMode?: InputMode,
): InputMode {
  if (propMode) return propMode;
  const mode = searchParams.get("mode")?.trim().toLowerCase();
  if (mode === "upload" || mode === "foto") return "upload";
  if (mode === "paste" || mode === "texto") return "paste";
  return "upload";
}

const tool = getPlanifyTool("correcao-ia");

const TONE_OPTIONS: { id: CorrectionTone; label: string }[] = [
  { id: "encorajador", label: "Encorajador" },
  { id: "direto", label: "Direto" },
  { id: "detalhado", label: "Detalhado" },
];

const RIGOR_OPTIONS: { id: CorrectionRigor; label: string }[] = [
  { id: "flexivel", label: "Flexível" },
  { id: "balanceado", label: "Balanceado" },
  { id: "rigoroso", label: "Rigoroso" },
];

function formatWhatsAppDevolutiva(
  index: number,
  resultado: CorrectionAiOutput,
): string {
  return [
    `*Aluno ${index + 1}* — Nota ${resultado.nota}/${resultado.notaMaxima} (${resultado.percentual}%)`,
    resultado.feedbackGeral,
    resultado.pontosFortes.length
      ? `\n✅ *Pontos fortes:*\n${resultado.pontosFortes.map((p) => `• ${p}`).join("\n")}`
      : "",
    resultado.pontosMelhoria.length
      ? `\n📌 *Melhorar:*\n${resultado.pontosMelhoria.map((p) => `• ${p}`).join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function CorrecaoClient({
  studioMode = false,
  onStudioClose,
  initialInputMode,
}: CorrecaoClientProps = {}) {
  const searchParams = useSearchParams();
  const school = useSchoolClasses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(loadTeacherCorrectionProfile);
  const [inputMode, setInputMode] = useState<InputMode>(() =>
    resolveInitialInputMode(searchParams, initialInputMode),
  );
  const [batchMode, setBatchMode] = useState(false);
  const [respostaAluno, setRespostaAluno] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [gabarito, setGabarito] = useState("");
  const [rubrica, setRubrica] = useState("");
  const [notaMaxima, setNotaMaxima] = useState(10);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [detectedStudents, setDetectedStudents] = useState(0);
  const [erro, setErro] = useState("");
  const [erroCta, setErroCta] = useState<ReturnType<typeof formatGenerationError>["cta"]>(null);
  const [erroRetryable, setErroRetryable] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [resultado, setResultado] = useState<CorrectionAiOutput | null>(null);
  const [resultadosLote, setResultadosLote] = useState<CorrectionAiOutput[]>([]);
  const [modalAberto, setModalAberto] = useState(studioMode);

  useEffect(() => {
    void syncTeacherCorrectionProfileFromServer().then(setProfile);
  }, []);

  useEffect(() => {
    const mode = searchParams.get("mode")?.trim().toLowerCase();
    if (mode === "upload" || mode === "foto") {
      setInputMode("upload");
    }
  }, [searchParams]);

  const exportSummary = useMemo(() => {
    if (!resultado) return "";
    return [
      `Nota: ${resultado.nota}/${resultado.notaMaxima} (${resultado.percentual}%)`,
      "",
      resultado.feedbackGeral,
      "",
      "Pontos fortes:",
      ...resultado.pontosFortes.map((p) => `• ${p}`),
      "",
      "Pontos de melhoria:",
      ...resultado.pontosMelhoria.map((p) => `• ${p}`),
      "",
      `Sugestão para o professor: ${resultado.sugestaoProfessor}`,
    ].join("\n");
  }, [resultado]);

  const whatsappLote = useMemo(() => {
    if (!resultadosLote.length) return "";
    return resultadosLote
      .map((item, index) => formatWhatsAppDevolutiva(index, item))
      .join("\n\n---\n\n");
  }, [resultadosLote]);

  function updateProfile(partial: Partial<typeof profile>) {
    const next = { ...profile, ...partial };
    setProfile(next);
    saveTeacherCorrectionProfile(next);
  }

  function applyFormattedError(error: unknown) {
    const formatted = formatGenerationError(error);
    setErro(formatted.message);
    setErroCta(formatted.cta ?? null);
    setErroRetryable(formatted.retryable);
  }

  async function processarUpload(file: File) {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);
    setOcrLoading(true);
    setOcrStatus("Lendo arquivo…");
    setUploadFileName(file.name);
    setDetectedStudents(0);

    try {
      const hint = batchMode ? "prova_completa" : "resposta";
      const { texto, avisos } = await extractTextFromUpload({ file, hint });

      const partes = splitMultiStudentText(texto);

      if (batchMode || partes.length > 1) {
        setRespostaAluno(partes.join("\n---\n"));
        setDetectedStudents(partes.length);
        if (partes.length > 1) {
          setBatchMode(true);
        }
      } else {
        setRespostaAluno(texto);
        setDetectedStudents(partes.length);
      }

      const statusParts: string[] = [];
      if (partes.length > 1) {
        statusParts.push(
          `${partes.length} estudante${partes.length > 1 ? "s" : ""} detectado${partes.length > 1 ? "s" : ""} — revise a separação antes de corrigir.`,
        );
      } else {
        statusParts.push("Texto extraído com sucesso. Confira abaixo antes de corrigir.");
      }
      if (avisos?.length) {
        statusParts.push(...avisos);
      }
      setOcrStatus(statusParts.join(" "));
    } catch (error) {
      setOcrStatus("");
      applyFormattedError(error);
    } finally {
      setOcrLoading(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processarUpload(file);
    event.target.value = "";
  }

  function parseRespostasLote(): string[] {
    return respostaAluno
      .split(/\n\s*---\s*\n/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 15)
      .slice(0, 5);
  }

  async function executarCorrecao() {
    setErro("");
    setErroCta(null);
    setErroRetryable(false);
    setResultado(null);
    setResultadosLote([]);

    const payloadBase = {
      enunciado: enunciado.trim() || undefined,
      gabarito: gabarito.trim() || undefined,
      rubrica: rubrica.trim() || undefined,
      componente: school.selectedClass?.discipline?.trim() || undefined,
      anoSerie: undefined,
      tema: enunciado.trim().slice(0, 120) || undefined,
      notaMaxima,
      teacherProfile: profile,
    };

    setLoading(true);

    try {
      if (batchMode) {
        const respostas = parseRespostasLote();
        if (respostas.length < 1) {
          setErro(
            "Separe as respostas com --- (mínimo 15 caracteres cada, máx. 5).",
          );
          return;
        }

        const response = await requestBatchCorrection({
          ...payloadBase,
          respostas,
        });

        setResultadosLote(response.resultados);
        for (const item of response.resultados) {
          learnFromCorrectionFeedback(item.feedbackGeral);
        }
      } else {
        const trimmed = respostaAluno.trim();
        if (trimmed.length < 15) {
          setErro("Cole a resposta do estudante com pelo menos 15 caracteres.");
          return;
        }

        const response = await requestCorrection({
          ...payloadBase,
          respostaAluno: trimmed,
        });

        setResultado(response.result);
        learnFromCorrectionFeedback(response.result.feedbackGeral);
      }

      const synced = await syncTeacherCorrectionProfileFromServer();
      setProfile(synced);
    } catch (error) {
      dispatchCreditsChangedIfNeeded(error);
      applyFormattedError(error);
    } finally {
      setLoading(false);
    }
  }

  async function baixarPdf() {
    const entries =
      resultadosLote.length > 0
        ? resultadosLote.map((result, index) => ({
            result,
            meta: {
              aluno: `Aluno ${index + 1}`,
              componente: school.selectedClass?.discipline?.trim() || undefined,
            },
          }))
        : resultado
          ? [
              {
                result: resultado,
                meta: {
                  componente: school.selectedClass?.discipline?.trim() || undefined,
                },
              },
            ]
          : [];

    if (!entries.length) return;

    setPdfLoading(true);
    try {
      const response = await planifyAuthenticatedFetch("/api/correcao/exportar-pdf", {
        method: "POST",
        body: JSON.stringify(
          resultadosLote.length > 0
            ? { resultados: entries }
            : { resultado: resultado, meta: entries[0]?.meta },
        ),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível gerar o PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        resultadosLote.length > 1 ? "devolutivas-planify.pdf" : "devolutiva-planify.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      applyFormattedError(error);
    } finally {
      setPdfLoading(false);
    }
  }

  function corrigir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void executarCorrecao();
  }

  async function copiarFeedback() {
    const text = whatsappLote || exportSummary;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
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
      tool={tool}
      studioMode={studioMode}
      onBack={fecharPainel}
      backLabel={studioMode ? "Início" : "Catálogo"}
      formScrollAttr={studioMode}
      previewScrollAttr={studioMode}
      form={
        <form onSubmit={corrigir} className="space-y-4">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-50/50 px-3 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Perfil do professor
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              A IA aprende seu estilo de devolutiva a cada correção.
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <p className={HUD_SECTION_LABEL}>Tom</p>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateProfile({ tom: item.id })}
                      className={
                        profile.tom === item.id
                          ? HUD_FILTER_CHIP_ACTIVE
                          : HUD_FILTER_CHIP_INACTIVE
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className={HUD_SECTION_LABEL}>Rigor</p>
                <div className="flex flex-wrap gap-2">
                  {RIGOR_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateProfile({ rigor: item.id })}
                      className={
                        profile.rigor === item.id
                          ? HUD_FILTER_CHIP_ACTIVE
                          : HUD_FILTER_CHIP_INACTIVE
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <TurmaCombobox school={school} />

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="corr-enunciado">
              Enunciado / questão (opcional)
            </label>
            <textarea
              id="corr-enunciado"
              value={enunciado}
              onChange={(event) => setEnunciado(event.target.value)}
              rows={3}
              className={HUD_TEXTAREA_CLASS}
              placeholder="Cole o enunciado ou descreva a tarefa avaliada…"
            />
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Modo de entrada da resposta"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === "upload"}
              onClick={() => setInputMode("upload")}
              className={
                inputMode === "upload"
                  ? HUD_FILTER_CHIP_ACTIVE
                  : HUD_FILTER_CHIP_INACTIVE
              }
            >
              Foto ou PDF
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === "paste"}
              onClick={() => setInputMode("paste")}
              className={
                inputMode === "paste"
                  ? HUD_FILTER_CHIP_ACTIVE
                  : HUD_FILTER_CHIP_INACTIVE
              }
            >
              Colar texto
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={batchMode}
              onClick={() => setBatchMode((current) => !current)}
              className={
                batchMode ? HUD_FILTER_CHIP_ACTIVE : HUD_FILTER_CHIP_INACTIVE
              }
            >
              Várias respostas
            </button>
          </div>

          {inputMode === "upload" ? (
            <div className="rounded-xl border border-cyan-400/35 bg-gradient-to-br from-cyan-50/90 to-white px-4 py-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">
                Corretor de provas em papel
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                Fotografe a prova, redação ou folha de respostas — o OCR extrai o
                texto automaticamente.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="pl-hud-btn mt-3 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {ocrLoading ? "Lendo arquivo…" : "Escolher foto ou PDF"}
              </button>
              {uploadFileName ? (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Arquivo: {uploadFileName}
                  {detectedStudents > 1
                    ? ` · ${detectedStudents} estudantes detectados`
                    : null}
                </p>
              ) : null}
              <p
                className="mt-2 text-xs font-medium text-slate-600"
                aria-live="polite"
                role="status"
              >
                {ocrLoading ? "Extraindo texto com IA…" : ocrStatus}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Formatos: JPG, PNG, WebP ou PDF (até 8 MB por foto, 15 MB por PDF).
                No celular, use a câmera. Para várias folhas de alunos, ative{" "}
                <span className="font-semibold text-slate-600">Várias respostas</span>{" "}
                antes de enviar.
              </p>
            </div>
          ) : null}

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="corr-resposta">
              {batchMode ? "Respostas dos estudantes" : "Resposta do estudante"}
            </label>
            <textarea
              id="corr-resposta"
              value={respostaAluno}
              onChange={(event) => setRespostaAluno(event.target.value)}
              rows={batchMode ? 10 : 8}
              className={HUD_TEXTAREA_CLASS}
              placeholder={
                batchMode
                  ? "Cole uma resposta por bloco, separadas por --- (máx. 5). Após upload de prova completa, a separação é automática."
                  : inputMode === "upload"
                    ? "O texto extraído da foto/PDF aparecerá aqui para revisão…"
                    : "Cole aqui a resposta do aluno (texto digitado ou transcrito)…"
              }
              required
            />
            {batchMode ? (
              <p className="mt-1 text-xs font-medium text-slate-500">
                Separe cada aluno com uma linha contendo apenas ---. Upload de
                prova completa detecta Aluno:, Nome: ou folhas separadas
                automaticamente.
                {detectedStudents > 1
                  ? ` ${detectedStudents} blocos prontos para correção.`
                  : null}
              </p>
            ) : null}
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="corr-gabarito">
              Gabarito / resposta esperada (opcional)
            </label>
            <textarea
              id="corr-gabarito"
              value={gabarito}
              onChange={(event) => setGabarito(event.target.value)}
              rows={3}
              className={HUD_TEXTAREA_CLASS}
            />
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="corr-rubrica">
              Rubrica / critérios (opcional)
            </label>
            <textarea
              id="corr-rubrica"
              value={rubrica}
              onChange={(event) => setRubrica(event.target.value)}
              rows={3}
              className={HUD_TEXTAREA_CLASS}
              placeholder="Ex.: domínio do conteúdo, organização, ortografia, adequação ao comando…"
            />
          </div>

          <div>
            <label className={HUD_SECTION_LABEL} htmlFor="corr-nota-max">
              Nota máxima
            </label>
            <input
              id="corr-nota-max"
              type="number"
              min={1}
              max={100}
              value={notaMaxima}
              onChange={(event) => setNotaMaxima(Number(event.target.value) || 10)}
              className={HUD_FIELD_CLASS}
            />
          </div>

          <GenerationCostHint
            creditCost={getClientCreditCost("correcao-ia")}
            className="mt-2"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || ocrLoading}
              className="pl-hud-btn rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {loading
                ? "Corrigindo…"
                : batchMode
                  ? "Corrigir lote"
                  : "Corrigir com IA"}
            </button>
            <CreditsBalancePill />
          </div>
          <GenerationErrorBanner
            message={erro}
            cta={erroCta}
            retryable={erroRetryable}
            onRetry={() => void executarCorrecao()}
            retrying={loading}
          />
          {inputMode === "upload" && erro ? (
            <button
              type="button"
              onClick={() => {
                setErro("");
                setErroCta(null);
                setInputMode("paste");
              }}
              className="text-xs font-bold text-cyan-800 underline"
            >
              Colar manualmente
            </button>
          ) : null}
        </form>
      }
      preview={
        <div className="space-y-4">
          {loading ? (
            <>
              <PlanifyOwlGenerationCoach
                active={loading}
                title={tool.loadingTitle}
                description={tool.loadingDescription}
                toolId="correcao-ia"
              />
              <MaterialPreviewSkeleton />
            </>
          ) : resultadosLote.length ? (
            <>
              {resultadosLote.map((item, index) => (
                <div
                  key={`lote-${index}`}
                  className="rounded-2xl border border-cyan-400/20 bg-white p-5 shadow-sm"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Aluno {index + 1}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">
                    {item.nota}
                    <span className="text-base font-bold text-slate-500">
                      /{item.notaMaxima}
                    </span>
                    <span className="ml-2 text-sm font-semibold text-cyan-700">
                      ({item.percentual}%)
                    </span>
                  </p>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-700">
                    {item.feedbackGeral}
                  </p>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copiarFeedback()}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Copiar devolutivas (WhatsApp)
                </button>
                <button
                  type="button"
                  onClick={() => void baixarPdf()}
                  disabled={pdfLoading}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {pdfLoading ? "Gerando PDF…" : "Baixar PDF"}
                </button>
              </div>
            </>
          ) : resultado ? (
            <>
              <div className="rounded-2xl border border-cyan-400/20 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Resultado
                </p>
                <p className="mt-2 text-3xl font-extrabold text-slate-950">
                  {resultado.nota}
                  <span className="text-lg font-bold text-slate-500">
                    /{resultado.notaMaxima}
                  </span>
                  <span className="ml-2 text-base font-semibold text-cyan-700">
                    ({resultado.percentual}%)
                  </span>
                </p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">
                  {resultado.feedbackGeral}
                </p>
              </div>

              {resultado.criterios.length ? (
                <div className="space-y-2">
                  <p className={HUD_SECTION_LABEL}>Critérios</p>
                  {resultado.criterios.map((criterio, index) => (
                    <div
                      key={`${criterio.criterio}-${index}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-950">
                          {criterio.criterio}
                        </p>
                        <span className="text-xs font-semibold text-cyan-700">
                          {criterio.pontos}/{criterio.pontosMaximos}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {criterio.comentario}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copiarFeedback()}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Copiar devolutiva
                </button>
                <button
                  type="button"
                  onClick={() => void baixarPdf()}
                  disabled={pdfLoading}
                  className="pl-hud-btn rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  {pdfLoading ? "Gerando PDF…" : "Baixar PDF"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-cyan-400/25 bg-white/70 px-6 py-12 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-600">
                Corretor de provas em papel
              </p>
              <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                Foto ou PDF → rubrica → devolutiva
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Envie foto da prova ou redação, aplique rubrica e receba nota,
                critérios e feedback alinhado ao seu estilo pedagógico.
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
          Corrigir prova
        </button>
      ) : null}
      {painelCriacao}
    </div>
  );
}
