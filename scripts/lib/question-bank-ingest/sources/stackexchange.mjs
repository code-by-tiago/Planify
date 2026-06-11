/**
 * Stack Exchange API — conteúdo CC BY-SA, uso via API oficial (sem scraping HTML).
 * https://api.stackexchange.com/docs
 */
import { bumpReject, bumpSource, normalizeWhitespace, stripHtml, validateQuestionCandidate } from "../shared.mjs";

export const SOURCE_ID = "stackexchange";

const SITES = [
  {
    site: "math.stackexchange.com",
    componente: "Matemática",
    etapa: "Ensino Médio",
    tags: [
      "fractions",
      "algebra-precalculus",
      "geometry",
      "arithmetic",
      "probability",
      "statistics",
    ],
  },
  {
    site: "chemistry.stackexchange.com",
    componente: "Química",
    etapa: "Ensino Médio",
    tags: ["stoichiometry", "organic-chemistry", "inorganic-chemistry", "physical-chemistry"],
  },
  {
    site: "biology.stackexchange.com",
    componente: "Biologia",
    etapa: "Ensino Médio",
    tags: ["cell-biology", "genetics", "ecology", "human-biology", "molecular-biology"],
  },
  {
    site: "physics.stackexchange.com",
    componente: "Física",
    etapa: "Ensino Médio",
    tags: ["kinematics", "energy", "electricity", "optics", "thermodynamics"],
  },
];

function buildApiUrl(path, params) {
  const url = new URL(`https://api.stackexchange.com/2.3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  if (process.env.STACKEXCHANGE_KEY) {
    url.searchParams.set("key", process.env.STACKEXCHANGE_KEY);
  }
  return url.toString();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PlanifyQuestionBankIngest/1.0 (educational OER)" },
  });
  if (!res.ok) throw new Error(`StackExchange HTTP ${res.status}`);
  const json = await res.json();
  if (json.error_message) throw new Error(json.error_message);
  return json;
}

function mapToCandidate(question, answerBody, siteConfig) {
  const enunciado = stripHtml(question.body || question.title);
  const resposta = stripHtml(answerBody);
  const title = normalizeWhitespace(question.title || "");

  const combined = title.length > 20 ? `${title}\n\n${enunciado}` : enunciado;

  return {
    enunciado: normalizeWhitespace(combined),
    tipo: "discursiva",
    alternativas: [],
    respostaEsperada: resposta.slice(0, 1200),
    criterioCorrecao: resposta.slice(0, 1200),
    componente: siteConfig.componente,
    anoSerie: "Ensino Médio",
    etapa: siteConfig.etapa,
    tema: title || siteConfig.componente,
    bnccCodigos: [],
    tags: ["stackexchange", siteConfig.site, ...(question.tags || []).slice(0, 5)],
    sourceTitle: `Stack Exchange · ${siteConfig.site} · #${question.question_id}`,
    sourceType: "ingest:stackexchange",
    authorName: "Stack Exchange (CC BY-SA)",
  };
}

export async function* iterateStackExchange(ctx) {
  for (const siteConfig of SITES) {
    for (const tag of siteConfig.tags) {
      let page = 1;
      let hasMore = true;

      while (hasMore && !ctx.shouldAbort()) {
        const url = buildApiUrl("questions", {
          site: siteConfig.site,
          tagged: tag,
          order: "desc",
          sort: "votes",
          pagesize: 50,
          page,
          filter: "withbody",
        });

        let payload;
        try {
          payload = await fetchJson(url);
        } catch (err) {
          ctx.log(`[stackexchange] erro ${siteConfig.site}/${tag} p${page}: ${err.message}`);
          break;
        }

        const questions = payload.items || [];
        if (!questions.length) break;

        const answerIds = questions
          .map((q) => q.accepted_answer_id)
          .filter(Boolean);

        /** @type {Map<number, string>} */
        let answersById = new Map();
        if (answerIds.length) {
          const ansBase = new URL(
            `https://api.stackexchange.com/2.3/answers/${answerIds.join(";")}`,
          );
          ansBase.searchParams.set("site", siteConfig.site);
          ansBase.searchParams.set("filter", "withbody");
          if (process.env.STACKEXCHANGE_KEY) {
            ansBase.searchParams.set("key", process.env.STACKEXCHANGE_KEY);
          }

          try {
            const ansPayload = await fetchJson(ansBase.toString());
            for (const ans of ansPayload.items || []) {
              answersById.set(ans.answer_id, ans.body || "");
            }
          } catch {
            // segue sem respostas nesta página
          }
        }

        for (const question of questions) {
          if (ctx.shouldAbort()) return;

          ctx.stats.scanned += 1;
          bumpSource(ctx.stats, SOURCE_ID, "scanned");

          const answerBody = answersById.get(question.accepted_answer_id);
          if (!answerBody) {
            bumpReject(ctx.stats, "sem_resposta_aceita");
            bumpSource(ctx.stats, SOURCE_ID, "rejected");
            continue;
          }

          const candidate = mapToCandidate(question, answerBody, siteConfig);
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

        hasMore = Boolean(payload.has_more);
        page += 1;

        const backoff = payload.backoff || 1;
        await ctx.sleep(Math.max(backoff, 1) * 1000);
      }
    }
  }
}
