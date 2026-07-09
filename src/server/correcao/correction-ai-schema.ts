import { z } from "zod";

const CorrectionCriterionZodSchema = z
  .object({
    criterio: z.string(),
    atendido: z.union([z.boolean(), z.string()]).optional(),
    pontos: z.number().optional(),
    pontosMaximos: z.number().optional(),
    comentario: z.string().optional(),
  })
  .passthrough();

export const CorrectionAiOutputZodSchema = z
  .object({
    nota: z.number(),
    notaMaxima: z.number().optional(),
    percentual: z.number().optional(),
    feedbackGeral: z.string(),
    criterios: z.array(CorrectionCriterionZodSchema).optional(),
    pontosFortes: z.array(z.string()).optional(),
    pontosMelhoria: z.array(z.string()).optional(),
    sugestaoProfessor: z.string().optional(),
  })
  .passthrough();

export type CorrectionAiOutputZod = z.infer<typeof CorrectionAiOutputZodSchema>;

export const CORRECTION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    nota: { type: "NUMBER" },
    notaMaxima: { type: "NUMBER" },
    percentual: { type: "NUMBER" },
    feedbackGeral: { type: "STRING" },
    criterios: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          criterio: { type: "STRING" },
          atendido: { type: "BOOLEAN" },
          pontos: { type: "NUMBER" },
          pontosMaximos: { type: "NUMBER" },
          comentario: { type: "STRING" },
        },
        required: ["criterio", "comentario"],
      },
    },
    pontosFortes: { type: "ARRAY", items: { type: "STRING" } },
    pontosMelhoria: { type: "ARRAY", items: { type: "STRING" } },
    sugestaoProfessor: { type: "STRING" },
  },
  required: ["nota", "feedbackGeral", "criterios"],
} as const;
