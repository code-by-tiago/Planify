/**
 * Fonte interna permitida: generated_materials já produzidos no Planify.
 */
import {
  bumpReject,
  bumpSource,
  createIngestStats,
  loadTsModule,
  normalizeWhitespace,
  stripHtml,
  validateQuestionCandidate,
} from "../shared.mjs";

const { extractQuestionsFromMaterialOutput } = loadTsModule(
  "src/lib/banco-questoes/question-bank-extract.ts",
);

function extractEngineExamQuestions(responseJson) {
  const root = responseJson?.estrutura || responseJson;
  if (!root || typeof root !== "object") return [];

  const exam = root.exam;
  if (!exam?.questions || !Array.isArray(exam.questions)) return [];

  return exam.questions
    .map((q, index) => {
      const statement = normalizeWhitespace(q.statement || q.enunciado);
      if (!statement) return null;

      const options = Array.isArray(q.options)
        ? q.options.map((o) => normalizeWhitespace(o)).filter(Boolean)
        : Array.isArray(q.alternativas)
          ? q.alternativas.map((o) => normalizeWhitespace(o)).filter(Boolean)
          : [];

      const type = String(q.type || q.tipo || "").toLowerCase();
      const isMc = type.includes("multipla") || type.includes("objetiva") || options.length >= 3;

      return {
        enunciado: statement,
        tipo: isMc ? "multipla-escolha" : "discursiva",
        alternativas: isMc ? options : [],
        respostaEsperada: normalizeWhitespace(q.answer || q.resposta || q.gabarito),
        criterioCorrecao: normalizeWhitespace(q.answer || q.resposta || ""),
        componente:
          root.componente ||
          root.disciplina ||
          responseJson?.discipline ||
          "Multicomponente",
        anoSerie: root.anoSerie || responseJson?.anoSerie || "Geral",
        etapa: root.etapa || "",
        tema: root.titulo || root.tema || responseJson?.tema || "",
        bnccCodigos: [],
        tags: ["planify", "material-gerado"],
        sourceTitle: `Planify · ${responseJson?.tipo || "material"}`,
        sourceType: "ingest:planify-materials",
        authorName: "Planify Curadoria OER",
      };
    })
    .filter(Boolean);
}

export const SOURCE_ID = "planify-materials";

/**
 * @param {object} ctx
 */
export async function* iteratePlanifyMaterials(ctx) {
  const stats = createIngestStats();
  const pageSize = 200;
  let offset = 0;

  while (!ctx.shouldAbort()) {
    const { data, error } = await ctx.supabase
      .from("generated_materials")
      .select("id, tipo, discipline, response_json, title")
      .in("tipo", ["lista", "prova", "atividade", "apostila"])
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`planify-materials: ${error.message}`);
    if (!data?.length) break;

    for (const row of data) {
      if (ctx.shouldAbort()) return;

      stats.scanned += 1;
      bumpSource(ctx.stats, SOURCE_ID, "scanned");

      const responseJson = row.response_json;
      const meta = {
        componente: row.discipline || "Multicomponente",
        tema: row.title || "",
        sourceTitle: row.title || `Material ${row.tipo}`,
        sourceType: "ingest:planify-materials",
        tags: ["planify", String(row.tipo || "material")],
      };

      const fromQuestoes = extractQuestionsFromMaterialOutput(
        responseJson?.estrutura || responseJson,
        meta,
      );
      const fromExam = extractEngineExamQuestions(responseJson);

      const batch = [...fromQuestoes, ...fromExam];
      for (const raw of batch) {
        const candidate = {
          ...raw,
          enunciado: stripHtml(raw.enunciado),
          alternativas: (raw.alternativas || []).map((a) => stripHtml(a)),
          respostaEsperada: stripHtml(raw.respostaEsperada),
          criterioCorrecao: stripHtml(raw.criterioCorrecao || raw.respostaEsperada),
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
    }

    if (data.length < pageSize) break;
    offset += pageSize;
    await ctx.sleep(100);
  }
}
