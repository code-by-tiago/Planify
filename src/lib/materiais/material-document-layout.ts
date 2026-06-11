import type { MaterialEngineRequest } from "@/server/materials/material-engine-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export type MaterialDocumentContext = {
  title: string;
  subtitle?: string;
  summary?: string;
  tipo: string;
  tema: string;
  request?: Partial<MaterialEngineRequest>;
};

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    prova: "Prova avaliativa",
    lista: "Lista de exercícios",
    apostila: "Apostila didática",
    atividade: "Atividade pedagógica",
    "plano-aula": "Plano de aula",
    redacao: "Proposta de redação",
    sequencia: "Sequência didática",
    projeto: "Projeto pedagógico",
    resumo: "Resumo guiado",
    revisao: "Material de revisão",
  };
  return map[tipo] || "Material didático";
}

function isDirectAssessmentType(tipo: string): boolean {
  return tipo === "prova" || tipo === "lista";
}

export function renderMaterialInstitutionHeader(ctx: MaterialDocumentContext): string {
  const req = ctx.request;
  const compact = isDirectAssessmentType(ctx.tipo);

  if (compact) {
    return `
    <header class="planify-doc-header planify-doc-header-compact planify-doc-header-teachy">
      <table class="planify-doc-meta planify-doc-meta-compact" role="presentation">
        <tbody>
          <tr>
            <th>Disciplina</th>
            <td>${escapeHtml(req?.componenteCurricular || "—")}</td>
            <th>Ano</th>
            <td>${escapeHtml(req?.anoSerie || "—")}</td>
          </tr>
          <tr>
            <th>Aluno(a)</th>
            <td colspan="3">____________________________________________</td>
          </tr>
          <tr>
            <th>Data</th>
            <td colspan="3">___/___/______</td>
          </tr>
        </tbody>
      </table>
    </header>
  `.trim();
  }

  const meta = [req?.componenteCurricular, req?.anoSerie, req?.etapa]
    .filter(Boolean)
    .map((item) => escapeHtml(String(item)));

  return `
    <header class="planify-doc-header">
      <p class="planify-doc-kicker">${escapeHtml(tipoLabel(ctx.tipo))}</p>
      <table class="planify-doc-meta" role="presentation">
        <tbody>
          <tr><th>Componente</th><td>${escapeHtml(req?.componenteCurricular || "—")}</td></tr>
          <tr><th>Ano/Série</th><td>${escapeHtml(req?.anoSerie || "—")}</td></tr>
          <tr><th>Etapa</th><td>${escapeHtml(req?.etapa || "—")}</td></tr>
          <tr><th>Tema</th><td>${escapeHtml(ctx.tema || "—")}</td></tr>
          ${meta.length ? `<tr><th>Data</th><td>___/___/______</td></tr>` : ""}
          <tr><th>Aluno(a)</th><td>____________________________________________</td></tr>
        </tbody>
      </table>
    </header>
  `.trim();
}

export function renderAssessmentInstructions(_tipo: string): string {
  return "";
}

/** Remove leading a)/A)/b) etc. — CSS ::before already adds option letters. */
export function stripOptionLetterPrefix(value: string): string {
  return String(value || "")
    .trim()
    .replace(/^[A-Ea-e][).:\-]\s*/, "");
}

export function normalizeQuestionOptions(options: string[] | undefined): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((item) => stripOptionLetterPrefix(String(item)))
    .filter(Boolean);
}

export function renderQuestionCard(params: {
  number: number | string;
  statement: string;
  options?: string[];
  questionType?: string;
  label?: string;
  compact?: boolean;
}): string {
  const itemLabel = params.label || "Questão";
  const num = String(params.number).padStart(2, "0");
  const compact = params.compact ?? false;

  const cleanOptions = normalizeQuestionOptions(params.options);

  const options =
    cleanOptions.length
      ? `<ol class="planify-questao-options" type="a">${cleanOptions
          .map((option) => `<li>${escapeHtml(option)}</li>`)
          .join("")}</ol>`
      : `<div class="planify-answer-lines" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>`;

  const typeBadge =
    !compact && params.questionType
      ? `<span class="planify-questao-type">${escapeHtml(params.questionType)}</span>`
      : "";

  const headContent = compact
    ? `<span class="planify-questao-number-badge" aria-label="${escapeHtml(itemLabel)} ${escapeHtml(String(params.number))}">${escapeHtml(num)}</span>`
    : `<div class="planify-questao-head">
        <span class="planify-questao-number-badge" aria-label="${escapeHtml(itemLabel)} ${escapeHtml(String(params.number))}">${escapeHtml(num)}</span>
        <span class="planify-questao-number-label">${escapeHtml(itemLabel)} ${escapeHtml(String(params.number))}</span>
        ${typeBadge}
      </div>`;

  return `
    <article class="planify-questao planify-questao-card${compact ? " planify-questao-card-compact" : ""}">
      ${headContent}
      <p class="planify-questao-statement">${escapeHtml(params.statement)}</p>
      ${options}
    </article>
  `.trim();
}

export function renderGabaritoTable(
  entries: { number: number | string; answer: string }[],
): string {
  const clean = entries.filter((entry) => entry.answer.trim());
  if (!clean.length) return "";

  const rows = clean
    .map(
      (entry) => `
        <tr>
          <td class="planify-gabarito-num">${escapeHtml(String(entry.number).padStart(2, "0"))}</td>
          <td class="planify-gabarito-answer">${escapeHtml(entry.answer)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <section class="planify-gabarito-block page-break">
      <h2>Gabarito</h2>
      <table class="planify-gabarito-table" role="presentation">
        <thead>
          <tr>
            <th class="planify-gabarito-num">#</th>
            <th class="planify-gabarito-answer">Resposta</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `.trim();
}

export function wrapProfessionalDocument(
  ctx: MaterialDocumentContext,
  bodyHtml: string,
): string {
  const instructions =
    ctx.tipo === "prova" || ctx.tipo === "lista"
      ? renderAssessmentInstructions(ctx.tipo)
      : "";

  const tipoClass = ctx.tipo
    ? `planify-doc-${ctx.tipo.replace(/[^a-z0-9-]/gi, "")}`
    : "";

  const compactDoc = isDirectAssessmentType(ctx.tipo);
  const showSummary =
    ctx.summary?.trim() &&
    !compactDoc &&
    ctx.tipo !== "resumo";

  return `
    <article class="planify-doc planify-doc-professional ${tipoClass}">
      ${renderMaterialInstitutionHeader(ctx)}
      ${compactDoc ? "" : `<h1 class="planify-doc-title">${escapeHtml(ctx.title)}</h1>`}
      ${!compactDoc && ctx.subtitle ? `<p class="planify-doc-subtitle">${escapeHtml(ctx.subtitle)}</p>` : ""}
      ${showSummary ? `<p class="planify-doc-summary">${escapeHtml(ctx.summary!)}</p>` : ""}
      ${instructions}
      <div class="planify-doc-body">
        ${bodyHtml}
      </div>
    </article>
  `.trim();
}
