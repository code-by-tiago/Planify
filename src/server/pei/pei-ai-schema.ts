import { z } from "zod";

const PeiCurricularRowSchema = z
  .object({
    conteudo: z.string().optional(),
    habilidade: z.string().optional(),
    objetivo: z.string().optional(),
    adaptacao: z.string().optional(),
  })
  .passthrough();

const PeiPlanningRowSchema = z
  .object({
    periodo: z.string().optional(),
    metodologia: z.string().optional(),
    recursos: z.string().optional(),
    avaliacao: z.string().optional(),
  })
  .passthrough();

/** Schema Zod permissivo — normalizeAiOutput completa campos faltantes. */
export const PeiAiOutputZodSchema = z
  .object({
    perfil: z.string().optional(),
    suportes: z.array(z.string()).optional(),
    acessibilidade: z.array(z.string()).optional(),
    objetivos: z.array(z.string()).optional(),
    curricularRows: z.array(PeiCurricularRowSchema).optional(),
    planejamento: z.array(PeiPlanningRowSchema).optional(),
    articulacao: z.array(z.string()).optional(),
    parecer: z.string().optional(),
  })
  .passthrough();

export type PeiAiOutputZod = z.infer<typeof PeiAiOutputZodSchema>;

export const PEI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    perfil: { type: "STRING" },
    suportes: { type: "ARRAY", items: { type: "STRING" } },
    acessibilidade: { type: "ARRAY", items: { type: "STRING" } },
    objetivos: { type: "ARRAY", items: { type: "STRING" } },
    curricularRows: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          conteudo: { type: "STRING" },
          habilidade: { type: "STRING" },
          objetivo: { type: "STRING" },
          adaptacao: { type: "STRING" },
        },
      },
    },
    planejamento: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          periodo: { type: "STRING" },
          metodologia: { type: "STRING" },
          recursos: { type: "STRING" },
          avaliacao: { type: "STRING" },
        },
      },
    },
    articulacao: { type: "ARRAY", items: { type: "STRING" } },
    parecer: { type: "STRING" },
  },
  required: ["perfil", "objetivos", "parecer"],
} as const;
