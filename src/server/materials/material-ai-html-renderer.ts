import {
  renderGabaritoTable,
  renderQuestionCard,
  wrapProfessionalDocument,
} from "@/lib/materiais/material-document-layout";
import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEngineRequest } from "./material-engine-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asList(items: string[], ordered = false): string {
  const clean = items.filter((item) => item.trim());
  if (!clean.length) return "";
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderSections(output: MaterialAIOutput): string {
  return output.secoes
    .map((section) => {
      const visual =
        section.visualHtml && section.visualHtml.trim()
          ? `<div class="planify-section-visual">${section.visualHtml}</div>`
          : "";

      return `
        <section class="planify-doc-section">
          <h2>${escapeHtml(section.titulo)}</h2>
          ${section.conteudo ? `<p>${escapeHtml(section.conteudo)}</p>` : ""}
          ${asList(section.itens)}
          ${visual}
        </section>
      `;
    })
    .join("");
}

function renderQuestions(output: MaterialAIOutput): string {
  if (!output.questoes.length) return "";

  const isDirect =
    output.tipo === "lista" ||
    output.tipo.includes("lista") ||
    output.tipo === "prova" ||
    output.tipo.includes("prova");

  const body = output.questoes
    .map((question) =>
      renderQuestionCard({
        number: question.numero,
        statement: question.enunciado,
        options: question.alternativas,
        label:
          output.tipo === "lista" || output.tipo.includes("lista")
            ? "Exercício"
            : "Questão",
        compact: isDirect,
      }),
    )
    .join("");

  if (isDirect) {
    return `<section class="planify-questoes-block planify-questoes-block-direct">${body}</section>`;
  }

  return `<section class="planify-questoes-block"><h2>Atividades e questões</h2>${body}</section>`;
}

function renderGabarito(output: MaterialAIOutput, incluirGabarito: boolean): string {
  if (!incluirGabarito) return "";

  const byNumber = new Map<number, string>();

  for (const question of output.questoes) {
    const answer = question.respostaEsperada?.trim();
    if (answer) {
      byNumber.set(question.numero, answer);
    }
  }

  for (const line of output.gabarito) {
    const match = line.match(/(?:quest[aã]o|exerc[ií]cio)\s*(\d+)\s*:\s*(.+)/i);
    if (match) {
      const num = Number(match[1]);
      if (!byNumber.has(num)) {
        byNumber.set(num, match[2].trim());
      }
    }
  }

  const entries = [...byNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, answer]) => ({ number, answer }));

  return renderGabaritoTable(entries);
}

function renderGame(output: MaterialAIOutput): string {
  const game = output.jogo;
  if (!game) return "";

  return `
    <section>
      <h2>Jogo: ${escapeHtml(game.nome)}</h2>
      ${game.objetivo ? `<p><strong>Objetivo:</strong> ${escapeHtml(game.objetivo)}</p>` : ""}
      ${game.materiais.length ? `<h3>Materiais</h3>${asList(game.materiais)}` : ""}
      ${game.preparacao.length ? `<h3>Preparação</h3>${asList(game.preparacao, true)}` : ""}
      ${game.regras.length ? `<h3>Regras</h3>${asList(game.regras, true)}` : ""}
      ${game.modoDeJogar.length ? `<h3>Modo de jogar</h3>${asList(game.modoDeJogar, true)}` : ""}
      ${game.variacoes.length ? `<h3>Variações</h3>${asList(game.variacoes)}` : ""}
      ${game.fechamento ? `<p><strong>Fechamento:</strong> ${escapeHtml(game.fechamento)}</p>` : ""}
    </section>
  `;
}

function renderProjeto(output: MaterialAIOutput): string {
  const projeto = output.projeto;
  if (!projeto) return "";

  return `
    <section>
      <h2>Projeto pedagógico</h2>
      <p><strong>Problema norteador:</strong> ${escapeHtml(projeto.problemaNorteador)}</p>
      ${projeto.etapas.length ? `<h3>Etapas</h3>${asList(projeto.etapas, true)}` : ""}
      <p><strong>Produto final:</strong> ${escapeHtml(projeto.produtoFinal)}</p>
      <p><strong>Avaliação:</strong> ${escapeHtml(projeto.avaliacao)}</p>
    </section>
  `;
}

function renderRoteiro(output: MaterialAIOutput): string {
  const roteiro = output.roteiro;
  if (!roteiro) return "";

  return `
    <section>
      <h2>Roteiro de estudo</h2>
      ${roteiro.antesDoEstudo.length ? `<h3>Antes do estudo</h3>${asList(roteiro.antesDoEstudo, true)}` : ""}
      ${roteiro.duranteOEstudo.length ? `<h3>Durante o estudo</h3>${asList(roteiro.duranteOEstudo, true)}` : ""}
      ${roteiro.depoisDoEstudo.length ? `<h3>Depois do estudo</h3>${asList(roteiro.depoisDoEstudo, true)}` : ""}
      ${roteiro.autoavaliacao.length ? `<h3>Autoavaliação</h3>${asList(roteiro.autoavaliacao)}` : ""}
    </section>
  `;
}

function renderCriteriaAndNotes(output: MaterialAIOutput): string {
  const blocks: string[] = [];

  if (output.criteriosAvaliacao.length) {
    blocks.push(
      `<section><h2>Critérios de avaliação</h2>${asList(output.criteriosAvaliacao)}</section>`,
    );
  }

  if (output.orientacoesProfessor.length) {
    blocks.push(
      `<section><h2>Orientações ao professor</h2>${asList(output.orientacoesProfessor)}</section>`,
    );
  }

  if (output.adaptacoesInclusivas.length) {
    blocks.push(
      `<section><h2>Adaptações inclusivas</h2>${asList(output.adaptacoesInclusivas)}</section>`,
    );
  }

  if (output.sugestoesUso.length) {
    blocks.push(
      `<section><h2>Sugestões de uso</h2>${asList(output.sugestoesUso)}</section>`,
    );
  }

  return blocks.join("");
}

function renderAlerts(output: MaterialAIOutput): string {
  const alertas = output.alertas?.filter((item) => item.trim()) ?? [];
  if (!alertas.length) return "";
  return `<aside class="planify-alertas"><h2>Observações</h2>${asList(alertas)}</aside>`;
}

export function renderMaterialAIOutputToHtml(
  output: MaterialAIOutput,
  request: MaterialEngineRequest,
): string {
  const incluirGabarito = request.incluirGabarito;
  const visualBlock = [output.printHtml, output.visualHtml]
    .find((value) => typeof value === "string" && value.trim());

  const blocks = [
    output.introducao
      ? `<section><h2>Introdução</h2><p>${escapeHtml(output.introducao)}</p></section>`
      : "",
    renderSections(output),
    renderProjeto(output),
    renderRoteiro(output),
    renderGame(output),
    renderQuestions(output),
    renderGabarito(output, incluirGabarito),
    renderCriteriaAndNotes(output),
    renderAlerts(output),
  ]
    .filter(Boolean)
    .join("");

  const doc = wrapProfessionalDocument(
    {
      title: output.titulo,
      subtitle: output.subtitulo,
      summary: output.resumo,
      tipo: output.tipo || request.tipoMaterial,
      tema: request.tema,
      request,
    },
    blocks,
  );

  if (visualBlock) {
    return `${doc}<div class="planify-visual-bundle">${visualBlock}</div>`;
  }

  return doc;
}
