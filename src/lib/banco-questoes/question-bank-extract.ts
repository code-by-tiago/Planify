import type { MaterialAIOutput } from "@/types/ai";
import type { QuestionBankItem } from "@/types/question-bank";
import { computeQuestionContentHash } from "@/lib/banco-questoes/question-bank-hash";
import { isQuestionSelfContained } from "@/lib/banco-questoes/question-bank-self-contained";

export function extractQuestionsFromMaterialOutput(
  estrutura: MaterialAIOutput | null | undefined,
  meta: {
    componente?: string;
    anoSerie?: string;
    etapa?: string;
    tema?: string;
    sourceTitle?: string;
    sourceType?: string;
    bnccCodigos?: string[];
    tags?: string[];
  } = {},
): Omit<QuestionBankItem, "id" | "createdAt" | "updatedAt">[] {
  if (!estrutura?.questoes?.length) return [];

  const componente =
    meta.componente ||
    estrutura.dadosGerais?.componenteCurricular ||
    "Multicomponente";
  const anoSerie = meta.anoSerie || estrutura.dadosGerais?.anoSerie || "Geral";
  const etapa = meta.etapa || estrutura.dadosGerais?.etapa || "";
  const tema = meta.tema || estrutura.dadosGerais?.tema || estrutura.titulo || "";

  return estrutura.questoes
    .filter((q) => {
      const enunciado = String(q.enunciado || "").trim();
      if (enunciado.length <= 10) return false;
      return isQuestionSelfContained(enunciado).ok;
    })
    .map((q) => {
      const enunciado = String(q.enunciado || "").trim();
      const tipo = String(q.tipo || "discursiva").trim();
      return {
        enunciado,
        tipo,
        alternativas: Array.isArray(q.alternativas)
          ? q.alternativas.map(String).filter(Boolean)
          : [],
        respostaEsperada: String(q.respostaEsperada || "").trim(),
        criterioCorrecao: String(q.criterioCorrecao || "").trim(),
        componente,
        anoSerie,
        etapa,
        tema,
        bnccCodigos: meta.bnccCodigos || [],
        tags: meta.tags || [],
        sourceTitle: meta.sourceTitle || estrutura.titulo,
        sourceType: meta.sourceType || estrutura.tipo,
        isCommunity: false,
        contentHash: computeQuestionContentHash(enunciado, tipo),
      };
    });
}
