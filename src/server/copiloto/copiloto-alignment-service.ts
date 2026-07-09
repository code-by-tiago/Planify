import type {
  CopilotoAlinhamento,
  CopilotoBnccSkill,
  CopilotoTendencia,
} from "@/lib/copiloto/types";
import { scoreQuestionBankMatch } from "@/lib/banco-questoes/question-bank-match";
import { suggestBnccByConteudos } from "@/server/bncc/bncc-suggestion-engine";
import { applyStageFilterToBnccSuggestionResult } from "@/server/bncc/bncc-suggestion-response";
import { listCommunityQuestions } from "@/server/banco-questoes/question-bank-db-service";

type AlignmentInput = {
  etapa: string;
  anoSerie: string;
  areaConhecimento?: string;
  componenteCurricular: string;
  tema: string;
  conteudo: string;
};

function collectionFonte(
  collection: string | undefined,
): CopilotoTendencia["fonte"] {
  const c = (collection || "").toLowerCase();
  if (c.includes("enem")) return "enem";
  if (c.includes("vestibular")) return "vestibular";
  if (c.includes("concurso")) return "concurso";
  return "banco";
}

function aggregateTendencias(
  items: Array<{
    tema: string;
    collection?: string;
    enunciado: string;
    score: number;
  }>,
): CopilotoTendencia[] {
  const byTopic = new Map<
    string,
    {
      label: string;
      count: number;
      fonte: CopilotoTendencia["fonte"];
      score: number;
    }
  >();

  for (const item of items) {
    const label = (item.tema || "").trim() || item.enunciado.slice(0, 60).trim();
    if (!label) continue;
    const key = label.toLowerCase();
    const fonte = collectionFonte(item.collection);
    const prev = byTopic.get(key);
    if (prev) {
      prev.count += 1;
      prev.score = Math.max(prev.score, item.score);
      if (fonte !== "banco") prev.fonte = fonte;
    } else {
      byTopic.set(key, { label, count: 1, fonte, score: item.score });
    }
  }

  return [...byTopic.values()]
    .sort((a, b) => b.count - a.count || b.score - a.score)
    .slice(0, 5)
    .map((meta) => ({
      fonte: meta.fonte,
      topico: meta.label,
      evidencias: meta.count,
      enfaseSugerida:
        meta.fonte === "enem"
          ? "Priorizar interpretação de texto/fonte e aplicação contextual, padrão ENEM."
          : meta.fonte === "vestibular"
            ? "Incluir cobrança analítica típica de vestibulares (contexto + transferência)."
            : meta.fonte === "concurso"
              ? "Enfatizar precisão conceitual e discriminação de alternativas."
              : "Reforçar o tópico com progressão de dificuldade.",
    }));
}

export async function buildCopilotoAlinhamento(
  input: AlignmentInput,
): Promise<CopilotoAlinhamento> {
  const tema = input.tema.trim();
  const conteudo = input.conteudo.trim() || tema;

  let habilidades: CopilotoBnccSkill[] = [];
  try {
    const raw = await suggestBnccByConteudos({
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento,
      componenteCurricular: input.componenteCurricular,
      conteudos: [conteudo],
      temaCentral: tema,
      assertiveMode: true,
    });
    const filtered = applyStageFilterToBnccSuggestionResult(
      raw,
      input.etapa,
      input.anoSerie,
    );
    habilidades = (filtered.habilidades || [])
      .slice(0, 4)
      .map((h) => ({
        codigo: h.codigo,
        descricao: h.descricao || "",
      }))
      .filter((h) => h.codigo);
  } catch (error) {
    console.warn("[copiloto/alignment] BNCC suggestion failed:", error);
  }

  let tendencias: CopilotoTendencia[] = [];
  try {
    const bank = await listCommunityQuestions({
      componente: input.componenteCurricular || undefined,
      query: tema || undefined,
      limit: 80,
    });

    const scored = bank
      .map((item) => ({
        tema: item.tema,
        collection: item.collection,
        enunciado: item.enunciado,
        score: scoreQuestionBankMatch(
          item,
          tema || conteudo,
          input.componenteCurricular,
          input.anoSerie,
        ),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);

    const examish = scored.filter((item) => {
      const c = (item.collection || "").toLowerCase();
      return (
        c.includes("enem") ||
        c.includes("vestibular") ||
        c.includes("concurso")
      );
    });

    tendencias = aggregateTendencias(examish.length >= 3 ? examish : scored);
  } catch (error) {
    console.warn("[copiloto/alignment] question bank failed:", error);
  }

  const bnccPart =
    habilidades.length > 0
      ? `BNCC: ${habilidades.map((h) => h.codigo).join(", ")}.`
      : "BNCC: nenhuma habilidade confirmada automaticamente; revise no brief.";

  const trendPart =
    tendencias.length > 0
      ? `Tendências de cobrança (banco ENEM/vestibular/concurso): ${tendencias
          .map((t) => t.topico)
          .join("; ")}.`
      : "Tendências: poucas evidências no banco para este tema; foque BNCC e objetivos da turma.";

  return {
    habilidades,
    tendencias,
    resumo: `${bnccPart} ${trendPart}`.trim(),
  };
}
