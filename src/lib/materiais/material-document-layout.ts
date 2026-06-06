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

export function renderMaterialInstitutionHeader(ctx: MaterialDocumentContext): string {
  const req = ctx.request;
  const meta = [
    req?.componenteCurricular,
    req?.anoSerie,
    req?.etapa,
  ]
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

export function renderAssessmentInstructions(tipo: string): string {
  if (tipo === "lista") {
    return `
      <section class="planify-doc-instructions">
        <h2>Instruções</h2>
        <ul>
          <li>Leia cada exercício com atenção antes de responder.</li>
          <li>Organize o desenvolvimento quando necessário.</li>
          <li>Revise ortografia, clareza e completude antes de entregar.</li>
        </ul>
      </section>
    `.trim();
  }

  if (tipo === "prova") {
    return `
      <section class="planify-doc-instructions">
        <h2>Instruções gerais</h2>
        <ul>
          <li>Leia todas as questões antes de começar.</li>
          <li>Responda de forma clara, objetiva e legível.</li>
          <li>Não é permitido o uso de celular ou material não autorizado.</li>
          <li>Boa prova.</li>
        </ul>
      </section>
    `.trim();
  }

  return "";
}

export function renderQuestionCard(params: {
  number: number | string;
  statement: string;
  options?: string[];
  questionType?: string;
}): string {
  const options =
    params.options && params.options.length
      ? `<ol class="planify-questao-options" type="a">${params.options
          .map((option) => `<li>${escapeHtml(option)}</li>`)
          .join("")}</ol>`
      : `<div class="planify-answer-lines" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>`;

  const typeBadge = params.questionType
    ? `<span class="planify-questao-type">${escapeHtml(params.questionType)}</span>`
    : "";

  return `
    <article class="planify-questao planify-questao-card">
      <div class="planify-questao-head">
        <span class="planify-questao-number">Questão ${escapeHtml(String(params.number))}</span>
        ${typeBadge}
      </div>
      <p class="planify-questao-statement">${escapeHtml(params.statement)}</p>
      ${options}
    </article>
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

  return `
    <article class="planify-doc planify-doc-professional">
      ${renderMaterialInstitutionHeader(ctx)}
      <h1 class="planify-doc-title">${escapeHtml(ctx.title)}</h1>
      ${ctx.subtitle ? `<p class="planify-doc-subtitle">${escapeHtml(ctx.subtitle)}</p>` : ""}
      ${ctx.summary ? `<p class="planify-doc-summary">${escapeHtml(ctx.summary)}</p>` : ""}
      ${instructions}
      <div class="planify-doc-body">
        ${bodyHtml}
      </div>
    </article>
  `.trim();
}
