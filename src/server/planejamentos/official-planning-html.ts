import { extractAnnualItemsForTrimester } from "@/lib/planejamentos/planning-trimestral-from-annual";
import {
  enrichTrimestralMatrixItem,
  formatMateriaisRecursosNecessarios,
} from "@/lib/planejamentos/planning-trimestral-fields";
import {
  finalizeMatrixLessonAllocation,
  formatMatrixAulaLabel,
  formatMatrixPeriodosLabel,
} from "./planning-lesson-allocation";
import type { PlanningMatrixItem, PlanningSkill } from "./planning-ai-service";
import {
  getOfficialPlanningFilename,
  getOfficialPlanningTipo,
  normalizeOfficialPlanningPayload,
  type OfficialPlanningPayload,
} from "./official-planning-docx";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nl2br(value: unknown): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getString(payload: OfficialPlanningPayload, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = payload[key as keyof OfficialPlanningPayload];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return fallback;
}

function getTipo(payload: OfficialPlanningPayload): "anual" | "trimestral" {
  return getOfficialPlanningTipo(payload) === "trimestral" ? "trimestral" : "anual";
}

function getTrimestre(payload: OfficialPlanningPayload): number {
  return Math.min(Math.max(parseNumber(payload.trimestre, 1), 1), 3);
}

function getMatrix(payload: OfficialPlanningPayload): PlanningMatrixItem[] {
  const matrix = payload.matrizPlanejamento?.conteudos;

  if (Array.isArray(matrix) && matrix.length > 0) {
    return finalizeMatrixLessonAllocation(matrix, payload);
  }

  return [];
}

function codesWithShortDescriptions(skills: PlanningSkill[]): string {
  return skills
    .slice(0, 3)
    .map((skill) => {
      const code = normalizeText(skill.codigo);
      const desc = normalizeText(skill.descricao);
      return desc ? `${code} — ${desc}` : code;
    })
    .filter(Boolean)
    .join("\n");
}

function shortText(value: string, max = 360): string {
  const text = normalizeText(value);
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function unitFor(payload: OfficialPlanningPayload, item: PlanningMatrixItem): string {
  const component = getString(payload, ["componenteCurricular", "componente"]).toLowerCase();
  const content = item.conteudo.toLowerCase();

  if (component.includes("portugues")) {
    if (content.includes("texto") || content.includes("dissert") || content.includes("argument")) {
      return "Produção textual e análise linguística";
    }
    if (content.includes("leitura") || content.includes("interpret")) {
      return "Leitura e interpretação";
    }
    return "Leitura, produção textual e oralidade";
  }
  if (component.includes("historia")) return "Tempo, memória, cultura e sociedade";
  if (component.includes("geografia")) return "O sujeito e seu lugar no mundo";
  if (component.includes("matematica")) return "Números, álgebra, geometria e grandezas";
  if (component.includes("ciencias")) return "Matéria, energia, vida e evolução";
  return getString(payload, ["areaConhecimento"], "Unidade temática");
}

function projectText(payload: OfficialPlanningPayload, items: PlanningMatrixItem[]): string {
  const contentList = items.map((item) => item.conteudo).join("; ");
  const custom = getString(payload, ["observacoes"], "");
  return (
    custom ||
    `Integração entre os conteúdos do período (${contentList}) por meio de leitura, pesquisa, produção, socialização, resolução de problemas e participação coletiva.`
  );
}

function evaluationText(items: PlanningMatrixItem[]): string {
  const unique = Array.from(
    new Set(items.map((item) => normalizeText(item.avaliacao || item.evidencias)).filter(Boolean)),
  );
  return unique.length
    ? unique.join("\n")
    : "Observação contínua, registros, atividades concluídas, participação, produções individuais/coletivas e devolutivas do professor.";
}

function totalPeriodos(items: PlanningMatrixItem[]): number {
  return items.reduce((total, item) => {
    const periodos = Number(item.periodos);
    return total + (Number.isFinite(periodos) && periodos > 0 ? periodos : 1);
  }, 0);
}

function formatPeriodos(total: number): string {
  const safeTotal = Math.max(1, Math.round(total));
  return safeTotal === 1 ? "1 período" : `${safeTotal} períodos`;
}

function annualCargaHoraria(payload: OfficialPlanningPayload): string {
  return (
    getString(payload, ["cargaHorariaAnual", "cargaHoraria"], "") ||
    formatPeriodos(totalPeriodos(getMatrix(payload)))
  );
}

function trimestralCargaHoraria(payload: OfficialPlanningPayload): string {
  const explicit = getString(payload, ["cargaHorariaTrimestral"], "");
  if (explicit) return explicit;

  const matrix = getMatrix(payload);
  const total =
    getTipo(payload) === "trimestral"
      ? totalPeriodos(matrix)
      : Math.max(1, Math.ceil(totalPeriodos(matrix) / 3));

  return formatPeriodos(total);
}

function semanalCargaHoraria(payload: OfficialPlanningPayload): string {
  const explicit = getString(payload, ["cargaHorariaSemanal"], "");
  if (explicit) return explicit;
  return formatPeriodos(
    Math.max(1, Math.round(parseNumber(trimestralCargaHoraria(payload), 13) / 13)),
  );
}

function resolveTrimestralMatrixItems(
  matrix: PlanningMatrixItem[],
  trimester: number,
): PlanningMatrixItem[] {
  const markedTrimesters = new Set(
    matrix
      .map((item) => Number(item.trimestre))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3),
  );

  if (markedTrimesters.size === 1) {
    return matrix;
  }

  return extractAnnualItemsForTrimester(matrix, trimester);
}

function trimestralSemanaLabel(item: PlanningMatrixItem): string {
  const periodos = Math.max(
    1,
    Number(item.periodos) || Number(item.aulaFim) - Number(item.aulaInicio) + 1 || 1,
  );
  const periodoLabel = periodos === 1 ? "período" : "períodos";

  if (periodos > 4) {
    return `Semanas ${item.aulaInicio} a ${item.aulaFim} (${periodos} ${periodoLabel})`;
  }

  return `Semana ${formatMatrixAulaLabel(item)} (${periodos} ${periodoLabel})`;
}

const OFFICIAL_STYLES = `
  .planify-planning-official{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.35;color:#111827}
  .planify-planning-official .planify-official-school{text-align:center;font-weight:800;font-size:14pt;margin:0 0 6px}
  .planify-planning-official .planify-official-area{text-align:center;margin:0 0 14px;color:#334155}
  .planify-planning-official table{width:100%;border-collapse:collapse;margin:10px 0 16px;table-layout:fixed}
  .planify-planning-official th,.planify-planning-official td{border:1px solid #111827;padding:6px 8px;vertical-align:top;word-wrap:break-word}
  .planify-planning-official th{background:#d9e2f3;font-weight:800;text-align:center;font-size:10pt}
  .planify-planning-official .planify-official-id td:first-child{width:34%;background:#f3f4f6;font-weight:700}
  .planify-planning-official .planify-official-trimester-title{background:#2f5597;color:#fff;font-weight:800;text-align:center;padding:8px;margin:18px 0 8px;font-size:12pt}
  .planify-planning-official .planify-official-support td:first-child{width:34%;background:#f3f4f6;font-weight:700}
  .planify-planning-official .planify-official-lesson{margin:0 0 24px;page-break-inside:avoid}
`;

function renderIdentificationTable(
  rows: Array<[string, string]>,
): string {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${nl2br(value)}</td></tr>`,
    )
    .join("");

  return `<table class="planify-official-id"><tbody>${body}</tbody></table>`;
}

function annualIdentificationRows(payload: OfficialPlanningPayload): Array<[string, string]> {
  return [
    ["Escola", getString(payload, ["escola"], "Escola não informada")],
    ["Professor(a)", getString(payload, ["professor"], "Professor(a) não informado(a)")],
    ["Etapa de ensino", getString(payload, ["etapa"], "Etapa não informada")],
    ["Ano/Série", getString(payload, ["anoSerie", "serie", "ano"], "Ano/Série")],
    ["Turma", getString(payload, ["turma", "className"], "Turma")],
    ["Área do conhecimento", getString(payload, ["areaConhecimento"], "Área do conhecimento")],
    [
      "Componente curricular",
      getString(payload, ["componenteCurricular", "componente"], "Componente curricular"),
    ],
    ["Carga horária anual", annualCargaHoraria(payload)],
  ];
}

function trimestralIdentificationRows(payload: OfficialPlanningPayload): Array<[string, string]> {
  return [
    ["Escola", getString(payload, ["escola"], "Escola não informada")],
    ["Professor(a)", getString(payload, ["professor"], "Professor(a) não informado(a)")],
    ["Etapa de ensino", getString(payload, ["etapa"], "Etapa não informada")],
    ["Ano/Série", getString(payload, ["anoSerie", "serie", "ano"], "Ano/Série")],
    ["Turma", getString(payload, ["turma", "className"], "Turma")],
    ["Área do conhecimento", getString(payload, ["areaConhecimento"], "Área do conhecimento")],
    [
      "Componente curricular",
      getString(payload, ["componenteCurricular", "componente"], "Componente curricular"),
    ],
    ["Período de desenvolvimento", `${getTrimestre(payload)}º trimestre`],
    ["Carga horária trimestral", trimestralCargaHoraria(payload)],
    ["Carga horária semanal", semanalCargaHoraria(payload)],
    ["Trimestre", `${getTrimestre(payload)}º trimestre`],
  ];
}

function renderAnnualMatrixTable(
  payload: OfficialPlanningPayload,
  items: PlanningMatrixItem[],
): string {
  const rows = items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(unitFor(payload, item))}</td>
        <td>${escapeHtml(item.conteudo)}</td>
        <td>${nl2br(codesWithShortDescriptions(item.habilidades))}</td>
        <td>${escapeHtml(formatMatrixPeriodosLabel(item))}</td>
        <td>${escapeHtml(formatMatrixAulaLabel(item))}</td>
      </tr>`,
    )
    .join("");

  return `<table>
    <thead>
      <tr>
        <th>Unidade Temática</th>
        <th>Objetos de Conhecimento</th>
        <th>Habilidades</th>
        <th>Previsão de carga horária</th>
        <th>Aula nº</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderSupportTable(
  payload: OfficialPlanningPayload,
  items: PlanningMatrixItem[],
): string {
  return `<table class="planify-official-support">
    <tbody>
      <tr><td>Projeto interdisciplinar / Temas integradores</td><td>${nl2br(projectText(payload, items))}</td></tr>
      <tr><td>Instrumentos de avaliação</td><td>${nl2br(evaluationText(items))}</td></tr>
    </tbody>
  </table>`;
}

function renderAnnualHtml(payload: OfficialPlanningPayload): string {
  const matrix = getMatrix(payload);
  const trimesters = [1, 2, 3]
    .map((trimester) => {
      const items = extractAnnualItemsForTrimester(matrix, trimester);
      if (!items.length) return "";

      return `
        <div class="planify-official-trimester-title">${trimester}º TRIMESTRE</div>
        ${renderAnnualMatrixTable(payload, items)}
        ${renderSupportTable(payload, items)}
      `;
    })
    .join("");

  return `<article class="planify-doc planify-planning-official" data-planify-html-source="official-template">
    <style>${OFFICIAL_STYLES}</style>
    ${renderIdentificationTable(annualIdentificationRows(payload))}
    ${trimesters}
  </article>`;
}

function renderTrimestralLessonDetails(
  payload: OfficialPlanningPayload,
  item: PlanningMatrixItem,
): string {
  const trimItem = enrichTrimestralMatrixItem(item);

  return `<table>
    <thead>
      <tr>
        <th>Objetos de Conhecimento</th>
        <th>Habilidades</th>
        <th>Expectativas de aprendizagem</th>
        <th>Previsão de carga horária</th>
        <th>Aula nº</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(trimItem.conteudo)}</td>
        <td>${nl2br(codesWithShortDescriptions(trimItem.habilidades))}</td>
        <td>${escapeHtml(shortText(trimItem.objetivos, 320))}</td>
        <td>${escapeHtml(formatMatrixPeriodosLabel(trimItem))}</td>
        <td>${escapeHtml(formatMatrixAulaLabel(trimItem))}</td>
      </tr>
    </tbody>
  </table>`;
}

function renderTrimestralExperienceTable(item: PlanningMatrixItem): string {
  const trimItem = enrichTrimestralMatrixItem(item);

  return `<table>
    <thead>
      <tr>
        <th>Semana</th>
        <th>Organização da metodologia</th>
        <th>Materiais e recursos necessários</th>
        <th>Etapas dessa experiência</th>
        <th>Evidências de aprendizagem</th>
        <th>Instrumentos de avaliação</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(trimestralSemanaLabel(trimItem))}</td>
        <td>${nl2br(shortText(trimItem.metodologia, 520))}</td>
        <td>${nl2br(shortText(formatMateriaisRecursosNecessarios(trimItem), 520))}</td>
        <td>${nl2br(shortText(trimItem.etapas || trimItem.metodologia, 520))}</td>
        <td>${nl2br(shortText(trimItem.evidencias, 520))}</td>
        <td>${nl2br(shortText(trimItem.avaliacao, 520))}</td>
      </tr>
    </tbody>
  </table>`;
}

function renderTrimestralProjectBlock(
  payload: OfficialPlanningPayload,
  item: PlanningMatrixItem,
): string {
  return `<table class="planify-official-support">
    <tbody>
      <tr><td>Projeto interdisciplinar / Temas integradores</td><td>${nl2br(projectText(payload, [item]))}</td></tr>
      <tr><td>Instrumentos de avaliação</td><td>${nl2br(evaluationText([item]))}</td></tr>
    </tbody>
  </table>`;
}

function renderTrimestralHtml(payload: OfficialPlanningPayload): string {
  const trimester = getTrimestre(payload);
  const items = resolveTrimestralMatrixItems(getMatrix(payload), trimester);
  const escola = getString(payload, ["escola"], "Escola não informada");
  const area = getString(payload, ["areaConhecimento"], "Área do conhecimento");

  const lessons = items
    .map(
      (item) => `<section class="planify-official-lesson">
        ${renderTrimestralLessonDetails(payload, item)}
        ${renderTrimestralExperienceTable(item)}
        ${renderTrimestralProjectBlock(payload, item)}
      </section>`,
    )
    .join("");

  return `<article class="planify-doc planify-planning-official" data-planify-html-source="official-template">
    <style>${OFFICIAL_STYLES}</style>
    <p class="planify-official-school">${escapeHtml(escola)}</p>
    <p class="planify-official-area">${escapeHtml(area)}</p>
    ${renderIdentificationTable(trimestralIdentificationRows(payload))}
    ${lessons}
  </article>`;
}

/**
 * @deprecated Prefer `buildOfficialPlanningEditorHtml` (DOCX oficial → HTML).
 * Mantido para scripts de compare; não usar em produção.
 */
export function buildOfficialPlanningHtml(
  payload: OfficialPlanningPayload,
  options?: { documentType?: string | null; documentId?: string | null },
): string {
  const normalized = normalizeOfficialPlanningPayload(
    payload,
    options?.documentType,
    options?.documentId,
  );

  if (!normalized.matrizPlanejamento?.conteudos?.length) {
    throw new Error(
      "Gere o planejamento com IA antes de renderizar. O Planify não preenche o modelo oficial sem matriz pedagógica.",
    );
  }

  const html =
    getTipo(normalized) === "trimestral"
      ? renderTrimestralHtml(normalized)
      : renderAnnualHtml(normalized);

  return html;
}

export function getOfficialPlanningHtmlFilename(payload: OfficialPlanningPayload): string {
  return getOfficialPlanningFilename(payload);
}
