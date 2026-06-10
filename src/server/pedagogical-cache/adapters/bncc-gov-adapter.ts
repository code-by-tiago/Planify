import "server-only";

import { parseHTML } from "linkedom";
import {
  fetchBnccSkillsFromDb,
  getCachedBnccSkills,
} from "@/server/bncc/bncc-catalog-service";
import type {
  PedagogicalScrapeQuery,
  PedagogicalScrapeResult,
  PedagogicalSourceAdapter,
} from "./pedagogical-source-adapter";
import { isRobotsAllowed } from "../robots-policy";

const USER_AGENT = "Planify/1.0 (pedagogical cache; contact: planify-app)";

export type BnccGovAdapterMode = "bncc_local" | "html_scrape";

function truncateSummary(text: string, max = 400): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function buildBnccBodyMarkdown(skill: {
  codigo: string;
  descricao: string;
  componente?: string;
  serie?: string;
  unidadeTematica?: string;
  objetoConhecimento?: string;
}): string {
  const lines = [
    `## Habilidade ${skill.codigo}`,
    "",
    skill.descricao,
  ];

  if (skill.componente) lines.push("", `**Componente:** ${skill.componente}`);
  if (skill.serie) lines.push(`**Ano/série:** ${skill.serie}`);
  if (skill.unidadeTematica) lines.push(`**Unidade temática:** ${skill.unidadeTematica}`);
  if (skill.objetoConhecimento) {
    lines.push(`**Objeto de conhecimento:** ${skill.objetoConhecimento}`);
  }

  return lines.join("\n");
}

async function fetchBnccLocal(
  query: PedagogicalScrapeQuery,
): Promise<PedagogicalScrapeResult | null> {
  const bnccCode = query.bnccCodigos?.[0]?.trim().toUpperCase();

  if (bnccCode) {
    const skills = await getCachedBnccSkills();
    const match = skills.find((s) => s.codigo === bnccCode);
    if (!match) return null;

    const body = buildBnccBodyMarkdown({
      codigo: match.codigo,
      descricao: match.descricao,
      componente: match.componente,
      serie: match.serie || match.ano,
      unidadeTematica: match.unidadeTematica,
      objetoConhecimento: match.objetoConhecimento,
    });

    return {
      title: `BNCC ${match.codigo}`,
      summary: truncateSummary(match.descricao),
      bodyMarkdown: body,
      sourceUrl: `https://basenacionalcomum.mec.gov.br/habilidade/${match.codigo}`,
      sourceTitle: `BNCC — ${match.codigo}`,
      license: "Dados Abertos BR",
      contentType: "definition",
      bnccCodigos: [match.codigo],
      confidence: 1.0,
    };
  }

  if (!query.tema?.trim() && !query.componente?.trim()) return null;

  const skills = await fetchBnccSkillsFromDb({
    subject: query.componente || null,
    grade: query.anoSerie || null,
    stage: query.etapa || null,
  });

  const temaNorm = query.tema
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const ranked = skills
    .map((skill) => {
      const haystack = [
        skill.descricao,
        skill.objetoConhecimento,
        skill.unidadeTematica,
        ...(skill.keywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "");

      const temaWords = temaNorm.split(/\s+/).filter((w) => w.length > 3);
      const hits = temaWords.filter((w) => haystack.includes(w)).length;
      return { skill, hits };
    })
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const best = ranked[0]?.skill;
  if (!best) return null;

  const body = buildBnccBodyMarkdown({
    codigo: best.codigo,
    descricao: best.descricao,
    componente: best.componente,
    serie: best.serie || best.ano,
    unidadeTematica: best.unidadeTematica,
    objetoConhecimento: best.objetoConhecimento,
  });

  return {
    title: `BNCC ${best.codigo}`,
    summary: truncateSummary(best.descricao),
    bodyMarkdown: body,
    sourceUrl: `https://basenacionalcomum.mec.gov.br/habilidade/${best.codigo}`,
    sourceTitle: `BNCC — ${best.codigo}`,
    license: "Dados Abertos BR",
    contentType: "definition",
    bnccCodigos: [best.codigo],
    confidence: 0.9,
  };
}

async function fetchGovOrientations(
  query: PedagogicalScrapeQuery,
  seedUrls: string[],
): Promise<PedagogicalScrapeResult | null> {
  if (!seedUrls.length) return null;

  const temaWords = query.tema
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (!temaWords.length) return null;

  for (const url of seedUrls) {
    const allowed = await isRobotsAllowed(url, USER_AGENT);
    if (!allowed) continue;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) continue;

      const html = await response.text();
      const { document } = parseHTML(html);
      const paragraphs = Array.from(document.querySelectorAll("p"))
        .map((p) => p.textContent?.trim() || "")
        .filter((text) => text.length > 40);

      const relevant = paragraphs.filter((text) => {
        const norm = text
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{M}/gu, "");
        return temaWords.some((word) => norm.includes(word));
      });

      if (!relevant.length) continue;

      const body = relevant.slice(0, 6).map((p) => p).join("\n\n");
      const title = document.querySelector("title")?.textContent?.trim() || "Orientações BNCC";

      return {
        title,
        summary: truncateSummary(relevant[0]),
        bodyMarkdown: `## ${title}\n\n${body}`,
        sourceUrl: url,
        sourceTitle: title,
        license: "Dados Abertos BR",
        contentType: "orientation",
        bnccCodigos: query.bnccCodigos,
        confidence: 0.6,
      };
    } catch {
      continue;
    }
  }

  return null;
}

export function createBnccGovAdapter(options: {
  slug: string;
  mode: BnccGovAdapterMode;
  seedUrls?: string[];
}): PedagogicalSourceAdapter {
  const seedUrls = options.seedUrls ?? [];

  return {
    slug: options.slug,

    canHandle(query: PedagogicalScrapeQuery): boolean {
      if (options.mode === "bncc_local") {
        return Boolean(
          query.bnccCodigos?.length ||
            query.tema?.trim() ||
            query.componente?.trim(),
        );
      }
      return Boolean(query.tema?.trim() && seedUrls.length > 0);
    },

    async fetch(query: PedagogicalScrapeQuery): Promise<PedagogicalScrapeResult | null> {
      if (options.mode === "bncc_local") {
        return fetchBnccLocal(query);
      }
      return fetchGovOrientations(query, seedUrls);
    },
  };
}

export const bnccSkillsAdapter = createBnccGovAdapter({
  slug: "bncc-skills",
  mode: "bncc_local",
});

export const bnccGovOrientacoesAdapter = createBnccGovAdapter({
  slug: "bncc-gov-orientacoes",
  mode: "html_scrape",
  seedUrls: ["https://basenacionalcomum.mec.gov.br/"],
});
