import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
  ScheduleTable,
} from "@/server/materials/material-engine-types";

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

export function renderPlanifyDocumentBrand(): string {
  return `
    <div class="planify-doc-brand" data-planify-doc-logo="true">
      <img class="planify-doc-brand-mark" src="/brand/planify-owl-graduate.png" alt="Planify" />
      <span class="planify-doc-brand-name">Planify</span>
    </div>
  `.trim();
}

export function renderMaterialInstitutionHeader(ctx: MaterialDocumentContext): string {
  const req = ctx.request;
  const compact = isDirectAssessmentType(ctx.tipo);

  if (compact) {
    return `
    <header class="planify-doc-header planify-doc-header-compact planify-doc-header-teachy">
      ${renderPlanifyDocumentBrand()}
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
      <div class="planify-doc-brand-row">
        ${renderPlanifyDocumentBrand()}
        <p class="planify-doc-kicker">${escapeHtml(tipoLabel(ctx.tipo))}</p>
      </div>
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

const TEACHY_MAX_STATEMENT_CHARS = 320;
const TEACHY_MAX_STATEMENT_SENTENCES = 3;

/** Enunciado Teachy: no máximo 3 frases curtas (prova/lista). */
export function trimTeachyStatement(statement: string): string {
  const trimmed = String(statement || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2);

  let compact =
    sentences.length > TEACHY_MAX_STATEMENT_SENTENCES
      ? sentences.slice(0, TEACHY_MAX_STATEMENT_SENTENCES).join(" ")
      : trimmed;

  if (compact.length > TEACHY_MAX_STATEMENT_CHARS) {
    const slice = compact.slice(0, TEACHY_MAX_STATEMENT_CHARS);
    const lastSpace = slice.lastIndexOf(" ");
    compact = `${(lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim()}…`;
  }

  return compact;
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

/** Resolve tabelas de cronograma — usa scheduleTables ou deriva de lessonPlan.steps (legado). */
export function resolveScheduleTables(
  response: Pick<MaterialEngineResponse, "scheduleTables" | "lessonPlan">,
): ScheduleTable[] {
  if (response.scheduleTables?.length) {
    return response.scheduleTables.map((table) => ({
      title: String(table.title || "Cronograma").trim(),
      headers: (table.headers ?? []).map((header) => String(header).trim()).filter(Boolean),
      rows: (table.rows ?? [])
        .map((row) => row.map((cell) => String(cell ?? "").trim()))
        .filter((row) => row.some((cell) => cell.length > 0)),
    }));
  }

  const steps = response.lessonPlan?.steps ?? [];
  if (!steps.length) return [];

  return [
    {
      title: "Cronograma da aula",
      headers: ["Etapa", "Duração", "Atividade", "Recursos"],
      rows: steps.map((step) => [
        String(step.stage || "").trim(),
        String(step.duration || "").trim(),
        String(step.description || "").trim(),
        (step.resources ?? []).map((item) => String(item).trim()).filter(Boolean).join(", "),
      ]),
    },
  ];
}

function renderScheduleTableHtml(table: ScheduleTable): string {
  const headers = table.headers;
  const rows = table.rows;
  if (!headers.length || !rows.length) return "";

  const head = headers
    .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
    .join("");

  const body = rows
    .map((row) => {
      const cells = headers
        .map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const title = table.title.trim();

  return `
    <section class="planify-cronograma-block">
      <h2 class="planify-cronograma-title">${escapeHtml(title)}</h2>
      <div class="planify-cronograma-scroll">
        <table class="planify-cronograma-table" role="presentation">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `.trim();
}

/** Renderiza cronogramas cronometrados em tabela HTML elegante. */
export function renderCronogramaTables(
  response: Pick<MaterialEngineResponse, "scheduleTables" | "lessonPlan">,
): string {
  const tables = resolveScheduleTables(response);
  if (!tables.length) return "";
  return tables.map((table) => renderScheduleTableHtml(table)).join("");
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
