import type { PlanifyGeneratedMaterial } from "../../types/material-generator";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeMaterialHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

const styles = {
  article: "font-family: Arial, sans-serif; color:#0f172a; line-height:1.65; max-width:920px; margin:0 auto;",
  cover: "margin:0 0 30px; padding:28px; border-radius:24px; background:linear-gradient(135deg,#f8fafc,#ffffff,#ecfeff); border:1px solid #cbd5e1;",
  section: "margin:28px 0; padding:22px; border:1px solid #dbeafe; border-radius:18px; background:#ffffff; page-break-inside:avoid; break-inside:avoid;",
  teacher: "margin:28px 0; padding:22px; border:1px solid #fde68a; border-radius:18px; background:#fffbeb; page-break-inside:avoid; break-inside:avoid;",
  h1: "margin:0; color:#0f172a; font-size:30px; line-height:1.12;",
  h2: "margin:0 0 14px; color:#0f172a; font-size:20px; line-height:1.25;",
  p: "margin:0 0 12px; color:#334155; line-height:1.65;",
  table: "width:100%; border-collapse:collapse; margin:16px 0 8px; font-size:13px;",
  th: "border:1px solid #cbd5e1; padding:10px; background:#f8fafc; color:#0f172a; text-align:left; vertical-align:top; font-weight:800;",
  td: "border:1px solid #cbd5e1; padding:10px; color:#0f172a; vertical-align:top;",
};

function list(items: string[] | undefined): string {
  const valid = (items || []).map((item) => String(item || "").trim()).filter(Boolean);
  if (!valid.length) return "";
  return `<ul style="margin:0; padding-left:22px; color:#334155; line-height:1.7;">${valid.map((item) => `<li style="margin:7px 0;">${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function section(title: string, content: string, teacher = false): string {
  if (!content.trim()) return "";
  return `<section style="${teacher ? styles.teacher : styles.section}"><h2 style="${styles.h2}">${escapeHtml(title)}</h2>${content}</section>`;
}

function renderBlocks(material: PlanifyGeneratedMaterial): string {
  return (material.secoes || [])
    .map((item, index) => {
      const blocks = (item.conteudo || [])
        .map((block) => {
          if (Array.isArray(block.itens) && block.itens.length > 0) {
            return list(block.itens);
          }

          if (block.tipoBloco === "destaque" || block.tipoBloco === "exemplo") {
            return `<blockquote style="margin:14px 0; padding:14px 16px; border-left:4px solid #06b6d4; background:#f0f9ff; border-radius:12px; color:#0f172a;">${escapeHtml(block.texto)}</blockquote>`;
          }

          if (block.tipoBloco === "lista") {
            return list([block.texto]);
          }

          return `<p style="${styles.p}">${escapeHtml(block.texto)}</p>`;
        })
        .join("\n");

      return section(`${index + 1}. ${item.titulo}`, blocks);
    })
    .join("\n");
}

function renderQuestions(material: PlanifyGeneratedMaterial): string {
  const questions = material.questoes || [];
  if (!questions.length) return "";

  const rows = questions.map((question) => {
    const alternatives = (question.alternativas || []).length
      ? `<ol type="A" style="margin:10px 0 0 20px; padding-left:18px;">${question.alternativas.map((item) => `<li style="margin:6px 0;">${escapeHtml(item)}</li>`).join("")}</ol>`
      : "";

    return `<article style="margin:16px 0; padding:18px; border:1px solid #e2e8f0; border-radius:16px; background:#ffffff; page-break-inside:avoid; break-inside:avoid;">
      <p style="margin:0 0 8px; color:#0369a1; font-size:12px; font-weight:800; text-transform:uppercase;">Questão ${question.numero} • ${escapeHtml(question.tipo || "atividade")}</p>
      <p style="${styles.p}"><strong>${escapeHtml(question.enunciado)}</strong></p>
      ${alternatives}
      <div style="margin-top:14px; padding:12px; border:1px dashed #94a3b8; border-radius:12px; background:#f8fafc; color:#64748b;">Resposta: ________________________________________________________________________________</div>
    </article>`;
  }).join("\n");

  return section("Versão do aluno — atividades", rows);
}

function renderAnswers(material: PlanifyGeneratedMaterial): string {
  const answers = material.gabarito || [];
  if (!answers.length) return "";

  return section(
    "Versão do professor — gabarito",
    `<ol style="margin:0; padding-left:22px; color:#334155; line-height:1.75;">${answers.map((answer) => `<li style="margin:8px 0;"><strong>Questão ${answer.questao}:</strong> ${escapeHtml(answer.resposta)}</li>`).join("")}</ol>`,
    true,
  );
}

function renderMetadata(material: PlanifyGeneratedMaterial): string {
  const dados = material.dadosGerais || {};
  const rows = [
    ["Etapa", dados.etapa || material.metadata?.etapaEnsino],
    ["Ano/Série", dados.anoSerie || material.metadata?.anoSerie],
    ["Componente", dados.componenteCurricular || material.metadata?.componenteCurricular],
    ["Tema", dados.tema || material.metadata?.temaCentral],
    ["Turma", dados.turma],
    ["Professor", dados.professor],
    ["Duração", dados.duracao || material.metadata?.tempoEstimado],
  ].filter(([, value]) => String(value || "").trim());

  if (!rows.length) return "";

  return section("Dados gerais", `<table style="${styles.table}"><tbody>${rows.map(([label, value]) => `<tr><th style="${styles.th}">${escapeHtml(label)}</th><td style="${styles.td}">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`);
}

export function buildMaterialHtml(material: PlanifyGeneratedMaterial): string {
  const objetivos = material.objetivosAprendizagem?.length ? material.objetivosAprendizagem : material.objetivos;

  return sanitizeMaterialHtml(`
<article class="planify-material" style="${styles.article}">
  <header style="${styles.cover}">
    <p style="margin:0 0 10px; color:#0891b2; font-size:12px; letter-spacing:.16em; text-transform:uppercase; font-weight:800;">${escapeHtml(material.tipo || material.metadata?.tipoMaterial || "Material didático")}</p>
    <h1 style="${styles.h1}">${escapeHtml(material.titulo || material.metadata?.titulo || "Material Planify")}</h1>
    ${material.subtitulo ? `<p style="margin:12px 0 0; color:#334155; font-weight:700;">${escapeHtml(material.subtitulo)}</p>` : ""}
    ${material.resumo ? `<p style="margin:16px 0 0; color:#475569; line-height:1.7;">${escapeHtml(material.resumo)}</p>` : ""}
  </header>

  ${renderMetadata(material)}
  ${section("Introdução didática", `<p style="${styles.p}">${escapeHtml(material.introducao?.texto || material.resumo || "")}</p>`)}
  ${section("Objetivos de aprendizagem", list(objetivos))}
  ${renderBlocks(material)}
  ${renderQuestions(material)}
  ${renderAnswers(material)}
  ${section("Critérios de avaliação", list(material.criteriosAvaliacao), true)}
  ${section("Sugestões de uso pelo professor", list(material.sugestoesUsoProfessor || material.sugestoesUso), true)}
</article>
  `.trim());
}
