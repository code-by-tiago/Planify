/**
 * Wikiversity PT — MediaWiki API (CC BY-SA).
 * Apenas API oficial; sem scraping de sites com ToS restritivo.
 */
import { bumpReject, bumpSource, normalizeWhitespace, validateQuestionCandidate } from "../shared.mjs";

export const SOURCE_ID = "wikiversity-pt";

const API = "https://pt.wikiversity.org/w/api.php";
const SEARCH_QUERIES = [
  "exercícios matemática",
  "exercícios física",
  "exercícios química",
  "exercícios biologia",
  "questionário",
  "atividades ensino fundamental",
  "atividades ensino médio",
];

const COMPONENTE_BY_QUERY = [
  { match: /matemática|álgebra|geometria|fração/i, componente: "Matemática" },
  { match: /física/i, componente: "Física" },
  { match: /química/i, componente: "Química" },
  { match: /biologia/i, componente: "Biologia" },
  { match: /português|língua/i, componente: "Língua Portuguesa" },
  { match: /história/i, componente: "História" },
  { match: /geografia/i, componente: "Geografia" },
];

async function wikiGet(params) {
  const url = new URL(API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "PlanifyQuestionBankIngest/1.0 (educational OER)" },
  });
  if (!res.ok) throw new Error(`Wikiversity HTTP ${res.status}`);
  return res.json();
}

function guessComponente(title, query) {
  const hay = `${title} ${query}`;
  for (const rule of COMPONENTE_BY_QUERY) {
    if (rule.match.test(hay)) return rule.componente;
  }
  return "Multicomponente";
}

function stripWikiMarkup(text) {
  return normalizeWhitespace(
    String(text || "")
      .replace(/\{\{[^}]+\}\}/g, " ")
      .replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, "$1")
      .replace(/'{2,5}/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/^[*#:;]+/gm, ""),
  );
}

/**
 * Extrai pares pergunta/resposta de wikitext (heurística).
 * @returns {Array<{ enunciado: string; respostaEsperada: string; tipo: string; alternativas: string[] }>}
 */
function parseWikiExercises(wikitext) {
  const plain = stripWikiMarkup(wikitext);
  const blocks = plain.split(/(?=(?:Questão|Exercício|Pergunta)\s*\d+)/i);
  const results = [];

  for (const block of blocks) {
    const qMatch = block.match(
      /(?:Questão|Exercício|Pergunta)\s*(\d+)[:\.]?\s*([\s\S]+?)(?=(?:Resposta|Gabarito|Solução)\s*\d*[:\.]|$)/i,
    );
    if (!qMatch) continue;

    const enunciado = normalizeWhitespace(qMatch[2]);
    const ansMatch = block.match(/(?:Resposta|Gabarito|Solução)\s*\d*[:\.]?\s*([\s\S]+)/i);
    const respostaEsperada = normalizeWhitespace(ansMatch?.[1] || "");

    if (enunciado.length < 35 || respostaEsperada.length < 3) continue;

    const altMatches = enunciado.match(/(?:^|\s)([a-eA-E])\)\s*([^a-eA-E)]+)/g);
    const alternativas = altMatches
      ? altMatches.map((m) => normalizeWhitespace(m.replace(/^[a-eA-E]\)\s*/i, "")))
      : [];

    results.push({
      enunciado,
      respostaEsperada,
      tipo: alternativas.length >= 3 ? "multipla-escolha" : "discursiva",
      alternativas: alternativas.slice(0, 5),
    });
  }

  // fallback: linhas numeradas "1." ou "1)"
  if (!results.length) {
    const lines = plain.split(/\n+/).filter((l) => l.trim().length > 20);
    for (let i = 0; i < lines.length - 1; i++) {
      const qLine = lines[i];
      if (!/^\d+[\).]\s/.test(qLine)) continue;
      const enunciado = normalizeWhitespace(qLine.replace(/^\d+[\).]\s*/, ""));
      const respostaEsperada = normalizeWhitespace(lines[i + 1]);
      if (enunciado.length < 35 || respostaEsperada.length < 3) continue;
      results.push({
        enunciado,
        respostaEsperada,
        tipo: "discursiva",
        alternativas: [],
      });
    }
  }

  return results.slice(0, 40);
}

export async function* iterateWikiversityPt(ctx) {
  const seenTitles = new Set();

  for (const query of SEARCH_QUERIES) {
    let offset = 0;

    while (!ctx.shouldAbort()) {
      const search = await wikiGet({
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: 20,
        sroffset: offset,
      });

      const hits = search.query?.search || [];
      if (!hits.length) break;

      for (const hit of hits) {
        if (ctx.shouldAbort()) return;
        if (seenTitles.has(hit.title)) continue;
        seenTitles.add(hit.title);

        const contentRes = await wikiGet({
          action: "query",
          prop: "revisions",
          rvprop: "content",
          titles: hit.title,
          rvslots: "main",
        });

        const pages = contentRes.query?.pages || {};
        const page = Object.values(pages)[0];
        const wikitext = page?.revisions?.[0]?.slots?.main?.["*"] || "";
        if (!wikitext || wikitext.length < 80) continue;

        const componente = guessComponente(hit.title, query);
        const parsed = parseWikiExercises(wikitext);

        for (const item of parsed) {
          ctx.stats.scanned += 1;
          bumpSource(ctx.stats, SOURCE_ID, "scanned");

          const candidate = {
            ...item,
            criterioCorrecao: item.respostaEsperada,
            componente,
            anoSerie: "Geral",
            etapa: "Ensino Fundamental",
            tema: hit.title,
            bnccCodigos: [],
            tags: ["wikiversity", "oer", "pt"],
            sourceTitle: `Wikiversity PT · ${hit.title}`,
            sourceType: "ingest:wikiversity-pt",
            authorName: "Wikiversity (CC BY-SA)",
          };

          const validation = validateQuestionCandidate(candidate);
          if (!validation.ok) {
            bumpReject(ctx.stats, validation.reason);
            bumpSource(ctx.stats, SOURCE_ID, "rejected");
            continue;
          }

          ctx.stats.accepted += 1;
          bumpSource(ctx.stats, SOURCE_ID, "accepted");
          yield candidate;
        }

        await ctx.sleep(1200);
      }

      if (!search.continue?.sroffset) break;
      offset = search.continue.sroffset;
      await ctx.sleep(800);
    }
  }
}
