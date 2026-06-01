import type { DocxDocumentSpec, DocxSection } from "./simple-docx-builder";

type AnyRecord = Record<string, any>;

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function cleanFilename(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "documento-planify";
}

function materialToSpec(document: AnyRecord): DocxDocumentSpec {
  const title = document.titulo || document.title || "Material didático Planify";
  const dados = document.dadosGerais || {};
  const sections: DocxSection[] = [];

  if (document.introducao) {
    sections.push({
      title: "Introdução",
      content: document.introducao,
    });
  }

  if (asArray(document.orientacoesAluno).length > 0) {
    sections.push({
      title: "Orientações ao aluno",
      items: document.orientacoesAluno,
    });
  }

  for (const section of asArray(document.secoes)) {
    sections.push({
      title: section.titulo || section.title || "Seção",
      content: section.conteudo || section.content || section.descricao || section.description || "",
      items: section.itens || [],
    });
  }

  if (asArray(document.questoes).length > 0) {
    sections.push({
      title: "Questões",
      items: document.questoes.map((question: AnyRecord) => {
        const parts = [
          `${question.numero || ""}. ${question.enunciado || ""}`.trim(),
          question.respostaEsperada
            ? `Resposta esperada: ${question.respostaEsperada}`
            : "",
          question.criterioCorrecao
            ? `Critério de correção: ${question.criterioCorrecao}`
            : "",
        ].filter(Boolean);

        return parts.join("\n");
      }),
    });
  }

  if (asArray(document.gabarito).length > 0) {
    sections.push({
      title: "Gabarito",
      items: document.gabarito,
    });
  }

  if (document.jogo) {
    sections.push(
      {
        title: `Jogo pedagógico: ${document.jogo.nome || title}`,
        content: document.jogo.objetivo || "",
      },
      {
        title: "Materiais do jogo",
        items: document.jogo.materiais || [],
      },
      {
        title: "Preparação",
        items: document.jogo.preparacao || [],
      },
      {
        title: "Regras",
        items: document.jogo.regras || [],
      },
      {
        title: "Modo de jogar",
        items: document.jogo.modoDeJogar || [],
      },
      {
        title: "Variações do jogo",
        items: document.jogo.variacoes || [],
      },
      {
        title: "Fechamento pedagógico",
        content: document.jogo.fechamento || "",
      },
    );
  }

  if (asArray(document.criteriosAvaliacao).length > 0) {
    sections.push({
      title: "Critérios de avaliação",
      items: document.criteriosAvaliacao,
    });
  }

  return {
    title: toStringValue(title),
    subtitle: toStringValue(document.tipo || "Material didático"),
    badge: "Material Planify",
    metadata: {
      Escola: dados.escola,
      Professor: dados.professor,
      Etapa: dados.etapa,
      "Ano/Série": dados.anoSerie,
      "Componente curricular": dados.componenteCurricular,
      Tema: dados.tema,
      Duração: dados.duracao,
    },
    sections,
    filename: cleanFilename(toStringValue(title)),
  };
}

function bibliotecaToSpec(document: AnyRecord): DocxDocumentSpec {
  const title = document.title || "Material da Biblioteca";

  return {
    title,
    subtitle: document.description || "Material da Biblioteca Premium",
    badge: "Biblioteca Premium",
    metadata: {
      Etapa: document.etapa,
      Categoria: document.categoria,
      Componente: document.componente,
      Finalidade: document.finalidade,
      Tags: asArray(document.tags).join(", "),
    },
    sections: [
      {
        title: "Descrição",
        content: document.description,
      },
      {
        title: "Conteúdo do material",
        content: document.conteudo,
      },
      {
        title: "Tags",
        items: document.tags || [],
      },
    ],
    filename: cleanFilename(toStringValue(title)),
  };
}

function marketplaceToSpec(document: AnyRecord): DocxDocumentSpec {
  const title = document.title || "Material do Marketplace";

  return {
    title,
    subtitle: document.description || "Material publicado no Marketplace",
    badge: "Marketplace Planify",
    metadata: {
      Autor: document.autor,
      Etapa: document.etapa,
      "Ano/Série": document.anoSerie,
      Componente: document.componente,
      Categoria: document.categoria,
      Arquivo: document.fileName,
      Downloads: document.downloads,
      Tags: asArray(document.tags).join(", "),
    },
    sections: [
      {
        title: "Descrição",
        content: document.description,
      },
      {
        title: "Instruções de uso",
        content: document.instrucoes,
      },
      {
        title: "Tags",
        items: document.tags || [],
      },
    ],
    filename: cleanFilename(toStringValue(title)),
  };
}

function genericToSpec(document: AnyRecord): DocxDocumentSpec {
  const title = document.title || document.titulo || "Documento Planify";

  return {
    title,
    subtitle: document.subtitle || document.description || "",
    badge: document.badge || "Planify",
    metadata: document.metadata || {},
    sections: asArray(document.sections).map((section) => ({
      title: section.title || section.titulo || "Seção",
      content: section.content || section.descricao || "",
      items: section.items || section.itens || [],
    })),
    filename: cleanFilename(toStringValue(title)),
  };
}

export function normalizeDocxPayload(body: AnyRecord): DocxDocumentSpec {
  const kind = body?.kind || body?.tipo || "generic";
  const document = body?.document || body?.data || body || {};

  if (kind === "material") {
    return materialToSpec(document);
  }

  if (kind === "biblioteca") {
    return bibliotecaToSpec(document);
  }

  if (kind === "marketplace") {
    return marketplaceToSpec(document);
  }

  return genericToSpec(document);
}
