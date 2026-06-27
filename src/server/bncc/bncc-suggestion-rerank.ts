import type { BNCCSkill } from "../../types/bncc";
import { generateGeminiJSON } from "../ai/gemini-client";

type RerankInput = {
  content: string;
  context: {
    etapa?: string;
    anoSerie?: string;
    componenteCurricular?: string;
  };
  candidates: Array<{ skill: BNCCSkill; score: number }>;
};

type RerankResponse = {
  codigos?: string[];
};

const FEW_SHOT_EXAMPLES = [
  {
    content: "Frações equivalentes",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componenteCurricular: "Matemática",
    expected: ["EF06MA07", "EF06MA08"],
  },
  {
    content: "Reações químicas e balanceamento",
    etapa: "Ensino Médio",
    anoSerie: "2ª série",
    componenteCurricular: "Química",
    expected: ["EM13CNT301", "EM13CNT302"],
  },
  {
    content: "Brasil Colônia e escravidão",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    expected: ["EF05HI01", "EF05HI02"],
  },
  {
    content: "Conotação e denotação",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    componenteCurricular: "Língua Portuguesa",
    expected: ["EM13LP06", "EM13LP10"],
  },
];

function buildCandidateList(candidates: Array<{ skill: BNCCSkill; score: number }>) {
  return candidates.map(({ skill, score }) => ({
    codigo: skill.codigo,
    descricao: skill.descricao,
    score,
  }));
}

export async function rerankBnccCandidates(
  input: RerankInput,
): Promise<Array<{ skill: BNCCSkill; score: number }>> {
  if (!process.env.GEMINI_API_KEY || input.candidates.length === 0) {
    return input.candidates;
  }

  const allowedCodes = new Set(
    input.candidates.map((item) => item.skill.codigo.toUpperCase()),
  );
  const candidateList = buildCandidateList(input.candidates);

  const systemInstruction = [
    "Você é um especialista BNCC brasileiro.",
    "Escolha até 3 códigos BNCC da lista fornecida que melhor correspondem ao conteúdo informado.",
    "Responda SOMENTE com JSON: { \"codigos\": [\"CODIGO1\", \"CODIGO2\"] }.",
    "Use exclusivamente códigos presentes na lista de candidatos — nunca invente códigos.",
  ].join(" ");

  const prompt = JSON.stringify(
    {
      exemplos: FEW_SHOT_EXAMPLES,
      contexto: input.context,
      conteudo: input.content,
      candidatos: candidateList,
    },
    null,
    2,
  );

  try {
    const response = await generateGeminiJSON<RerankResponse>({
      systemInstruction,
      prompt,
      temperature: 0.1,
      maxAttempts: 1,
      timeoutMs: 12_000,
    });

    const codigos = (response.codigos || [])
      .map((code) => String(code || "").trim().toUpperCase())
      .filter((code) => allowedCodes.has(code));

    if (codigos.length === 0) {
      return input.candidates;
    }

    const byCode = new Map(
      input.candidates.map((item) => [item.skill.codigo.toUpperCase(), item]),
    );

    const reranked: Array<{ skill: BNCCSkill; score: number }> = [];

    for (const code of codigos) {
      const item = byCode.get(code);

      if (item) {
        reranked.push({ ...item, score: item.score + 3 });
      }
    }

    for (const item of input.candidates) {
      if (!codigos.includes(item.skill.codigo.toUpperCase())) {
        reranked.push(item);
      }
    }

    return reranked.slice(0, input.candidates.length);
  } catch {
    return input.candidates;
  }
}

export function shouldRerankBnccCandidates(
  candidates: Array<{ skill: BNCCSkill; score: number }>,
): boolean {
  const strong = candidates.filter((item) => item.score >= 8);
  return strong.length < 2 && candidates.length >= 2;
}
