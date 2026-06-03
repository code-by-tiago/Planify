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

export function buildMaterialHtml(material: PlanifyGeneratedMaterial): string {
  const sections = (material.secoes || [])
    .map((section) => {
      const blocks = (section.conteudo || [])
        .map((block) => {
          if (Array.isArray(block.itens) && block.itens.length > 0) {
            return `<ul>${block.itens.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
          }

          if (block.tipoBloco === "destaque") {
            return `<blockquote>${escapeHtml(block.texto)}</blockquote>`;
          }

          return `<p>${escapeHtml(block.texto)}</p>`;
        })
        .join("\n");

      return `<section><h2>${escapeHtml(section.titulo)}</h2>${blocks}</section>`;
    })
    .join("\n");

  const questions = (material.questoes || [])
    .map((question) => {
      const alternatives = (question.alternativas || []).length
        ? `<ol type="A">${question.alternativas.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
        : "";

      return `<li><p><strong>${escapeHtml(question.enunciado)}</strong></p>${alternatives}<p>Resposta: ________________________________________________</p></li>`;
    })
    .join("\n");

  const answers = (material.gabarito || [])
    .map((answer) => `<li><strong>Questão ${answer.questao}:</strong> ${escapeHtml(answer.resposta)}</li>`)
    .join("\n");

  return sanitizeMaterialHtml(`
<article class="planify-material">
  <h1>${escapeHtml(material.titulo)}</h1>
  <p><strong>${escapeHtml(material.subtitulo)}</strong></p>
  <p>${escapeHtml(material.resumo)}</p>
  <h2>Objetivos de aprendizagem</h2>
  <ul>${(material.objetivos || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  ${sections}
  ${questions ? `<h2>Atividades</h2><ol>${questions}</ol>` : ""}
  ${answers ? `<h2>Gabarito do professor</h2><ol>${answers}</ol>` : ""}
  <h2>Critérios de avaliação</h2>
  <ul>${(material.criteriosAvaliacao || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h2>Sugestões de uso pelo professor</h2>
  <ul>${(material.sugestoesUsoProfessor || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
</article>
  `.trim());
}
