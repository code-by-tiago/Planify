import type {
  PlanningAiPayload,
  PlanningMatrixItem,
} from "@/server/planejamentos/planning-ai-service";
import {
  formatMatrixAulaLabel,
  formatMatrixPeriodosLabel,
} from "@/server/planejamentos/planning-lesson-allocation";

export type PlanningEditorHtmlContext = {
  escola?: string;
  professor?: string;
  etapa?: string;
  anoSerie?: string;
  areaConhecimento?: string;
  componenteCurricular?: string;
  cargaHoraria?: string;
  tipoPlanejamento?: string;
  trimestre?: string;
};

export type GeneratedPlanningHtml = {
  tipoPlanejamento: string;
  titulo: string;
  resumo: string;
  conteudos: PlanningMatrixItem[];
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nl2br(value: unknown) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function skillFullText(skill: { codigo?: string; descricao?: string }) {
  const codigo = String(skill?.codigo || "BNCC");
  const descricao = String(skill?.descricao || "");

  return descricao ? `${codigo} — ${descricao}` : codigo;
}

function editorUnitFor(form: PlanningEditorHtmlContext, item: PlanningMatrixItem) {
  const component = String(form.componenteCurricular || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const content = item.conteudo
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  if (component.includes("lingua portuguesa") || component.includes("portugues")) {
    if (content.includes("texto") || content.includes("argument") || content.includes("dissert")) {
      return "Produção textual e análise linguística";
    }

    if (content.includes("leitura") || content.includes("interpret")) {
      return "Leitura e interpretação";
    }

    return "Leitura, produção textual e oralidade";
  }

  if (component.includes("historia")) return "Tempo, memória, cultura e sociedade";
  if (component.includes("matematica")) return "Números, álgebra, geometria e grandezas";
  if (component.includes("geografia")) return "O sujeito e seu lugar no mundo";
  if (component.includes("ciencias")) return "Matéria, energia, vida e evolução";

  return form.areaConhecimento || "Unidade temática";
}

function editorItemsByTrimester(planning: GeneratedPlanningHtml, trimester: number) {
  const explicit = planning.conteudos.filter((item) => Number(item.trimestre) === trimester);

  if (explicit.length > 0) {
    return explicit;
  }

  const chunkSize = Math.max(1, Math.ceil(planning.conteudos.length / 3));
  const start = (trimester - 1) * chunkSize;

  return planning.conteudos.slice(start, start + chunkSize);
}

export function planningPayloadToHtmlContext(
  payload: PlanningAiPayload,
): PlanningEditorHtmlContext {
  return {
    escola: payload.escola,
    professor: payload.professor,
    etapa: payload.etapa,
    anoSerie: payload.anoSerie,
    areaConhecimento: payload.areaConhecimento,
    componenteCurricular: payload.componenteCurricular,
    cargaHoraria: String(payload.cargaHoraria ?? ""),
    tipoPlanejamento: payload.tipoPlanejamento,
    trimestre: String(payload.trimestre ?? "1"),
  };
}

export function buildPlanningEditorHtml(
  form: PlanningEditorHtmlContext,
  planning: GeneratedPlanningHtml,
): string {
  const baseStyles = `
    <style>
      .planify-doc { font-family: Arial, sans-serif; color: #111827; line-height: 1.35; }
      .planify-doc h1 { text-align: center; font-size: 22px; margin: 10px 0 14px; }
      .planify-doc h2 { font-size: 18px; margin: 22px 0 10px; color: #0f766e; }
      .planify-doc h3 { font-size: 15px; margin: 16px 0 8px; color: #0f172a; }
      .planify-doc table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; table-layout: fixed; }
      .planify-doc th, .planify-doc td { border: 1px solid #64748b; padding: 8px; vertical-align: top; font-size: 12px; }
      .planify-doc th { background: #e2e8f0; font-weight: 700; }
      .planify-doc .header td:first-child { width: 24%; background: #e2e8f0; font-weight: 700; }
      .planify-doc .trim-title { background: #0f766e; color: white; font-weight: 700; text-align: center; }
      .planify-doc .small { font-size: 11px; color: #334155; }
    </style>
  `;

  const identity = `
    <table class="header">
      <tr><td>Escola</td><td>${escapeHtml(form.escola || "Escola não informada")}</td></tr>
      <tr><td>Professor(a)</td><td>${escapeHtml(form.professor || "Professor(a) não informado(a)")}</td></tr>
      <tr><td>Etapa / Ano-Série</td><td>${escapeHtml(form.etapa)} — ${escapeHtml(form.anoSerie)}</td></tr>
      <tr><td>Área / Componente</td><td>${escapeHtml(form.areaConhecimento)} — ${escapeHtml(form.componenteCurricular)}</td></tr>
      <tr><td>Carga horária</td><td>${escapeHtml(form.cargaHoraria)}</td></tr>
    </table>
  `;

  const tipo = String(form.tipoPlanejamento || "anual").toLowerCase();

  if (tipo.includes("tri")) {
    const trimester = Number(form.trimestre || 1);
    const items =
      planning.conteudos.filter((item) => Number(item.trimestre) === trimester).length > 0
        ? planning.conteudos.filter((item) => Number(item.trimestre) === trimester)
        : planning.conteudos;

    const tables = items
      .map(
        (item) => `
          <table>
            <tr><th colspan="2" class="trim-title">${trimester}º trimestre — Aula ${escapeHtml(formatMatrixAulaLabel(item))} · ${escapeHtml(formatMatrixPeriodosLabel(item))}</th></tr>
            <tr><td><strong>Objetos de conhecimento</strong></td><td>${escapeHtml(item.conteudo)}</td></tr>
            <tr><td><strong>Habilidades BNCC</strong></td><td>${nl2br(item.habilidades.map(skillFullText).join("\n"))}</td></tr>
            <tr><td><strong>Objetivos / expectativas</strong></td><td>${escapeHtml(item.objetivos)}</td></tr>
            <tr><td><strong>Metodologia / etapas</strong></td><td>${escapeHtml(item.metodologia)}</td></tr>
            <tr><td><strong>Recursos</strong></td><td>${escapeHtml(item.recursos)}</td></tr>
            <tr><td><strong>Evidências e avaliação</strong></td><td>${nl2br(`${item.evidencias}\n${item.avaliacao}`)}</td></tr>
          </table>
        `,
      )
      .join("");

    return `
      ${baseStyles}
      <article class="planify-doc">
        <h1>PLANEJAMENTO TRIMESTRAL — ${trimester}º TRIMESTRE</h1>
        ${identity}
        ${tables}
      </article>
    `;
  }

  const trimesterBlocks = [1, 2, 3]
    .map((trimester) => {
      const items = editorItemsByTrimester(planning, trimester);

      if (!items.length) {
        return "";
      }

      const rows = items
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(editorUnitFor(form, item))}</td>
              <td>${escapeHtml(item.conteudo)}</td>
              <td>${nl2br(item.habilidades.map(skillFullText).join("\n"))}</td>
              <td>${escapeHtml(item.objetivos)}</td>
              <td>${escapeHtml(formatMatrixPeriodosLabel(item))}</td>
              <td>${escapeHtml(formatMatrixAulaLabel(item))}</td>
            </tr>
          `,
        )
        .join("");

      const projectText = items.map((item) => item.conteudo).join("; ");
      const evaluationText = items.map((item) => item.avaliacao).filter(Boolean).join("\n");

      return `
        <h2>${trimester}º trimestre</h2>
        <table>
          <tr>
            <th>Unidade Temática</th>
            <th>Objetos de Conhecimento</th>
            <th>Habilidades</th>
            <th>Expectativas de aprendizagem</th>
            <th>Previsão de carga horária</th>
            <th>Aula nº</th>
          </tr>
          ${rows}
        </table>

        <table>
          <tr><td><strong>Projetos interdisciplinares / Temas integradores</strong></td><td>Integração dos conteúdos do trimestre (${escapeHtml(projectText)}) por meio de leitura, pesquisa, produção, participação coletiva e socialização das aprendizagens.</td></tr>
          <tr><td><strong>Instrumentos de avaliação</strong></td><td>${nl2br(evaluationText || "Observação contínua, registros, atividades concluídas, participação, produções individuais/coletivas e devolutivas do professor.")}</td></tr>
        </table>
      `;
    })
    .join("");

  return `
    ${baseStyles}
    <article class="planify-doc">
      <h1>PLANEJAMENTO ANUAL</h1>
      ${identity}
      ${trimesterBlocks}
    </article>
  `;
}
