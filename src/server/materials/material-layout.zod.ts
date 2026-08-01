/**
 * Contrato Zod do MaterialLayout — validação tipada pós-Gemini.
 * Espelha src/server/materials/types.ts (fonte de verdade TypeScript).
 */

import { z } from "zod";

const QuestaoAlternativaSchema = z.object({
  letra: z.enum(["A", "B", "C", "D", "E"]),
  texto: z.string(),
});

const QuestaoItemSchema = z.object({
  numero: z.number(),
  enunciado: z.string().min(1),
  tipo: z.enum([
    "multipla-escolha",
    "verdadeiro-falso",
    "dissertativa",
    "completar",
  ]),
  alternativas: z.array(QuestaoAlternativaSchema).optional(),
  respostaCorreta: z.string(),
  justificativa: z.string(),
});

const TextoConteudoSchema = z
  .object({
    paragrafos: z.array(z.string()).optional(),
    bullets: z.array(z.string()).optional(),
  })
  .passthrough();

const TabelaConteudoSchema = z
  .object({
    cabecalhos: z.array(z.string()),
    linhas: z.array(z.array(z.string())),
  })
  .passthrough();

const QuestoesConteudoSchema = z
  .object({
    questoes: z.array(QuestaoItemSchema),
  })
  .passthrough();

const SlideItemSchema = z.object({
  titulo: z.string(),
  topicos: z.array(z.string()),
  notasProfessor: z.string().optional(),
  layout: z
    .enum(["capa", "conteudo", "duasColunas", "destaque", "fechamento"])
    .optional(),
  imagePrompt: z.string().optional(),
});

const SlideConteudoSchema = z
  .object({
    slides: z.array(SlideItemSchema),
  })
  .passthrough();

const SecaoConteudoSchema = z.union([
  QuestoesConteudoSchema,
  TabelaConteudoSchema,
  SlideConteudoSchema,
  TextoConteudoSchema,
  z.record(z.unknown()),
]);

export const MaterialSecaoSchema = z.object({
  titulo: z.string(),
  tipo: z.enum(["texto", "tabela", "questoes", "slide"]),
  conteudo: SecaoConteudoSchema,
});

export const MaterialLayoutZodSchema = z.object({
  metadata: z.object({
    tema: z.string(),
    serie: z.string(),
    habilidadeBNCC: z.string(),
    codigoBNCC: z.string(),
  }),
  secoes: z.array(MaterialSecaoSchema).min(1),
});

export type MaterialLayoutZod = z.infer<typeof MaterialLayoutZodSchema>;

export function parseMaterialLayoutStrict(raw: unknown): {
  ok: true;
  data: MaterialLayoutZod;
} | {
  ok: false;
  issues: string[];
} {
  const parsed = MaterialLayoutZodSchema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  return {
    ok: false,
    issues: parsed.error.issues.slice(0, 8).map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    }),
  };
}
