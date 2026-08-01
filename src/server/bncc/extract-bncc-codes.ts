import type { Json } from "@/types/database";

export const BNCC_CODE_PATTERN =
  /\b(EF\d{2}[A-Z]{2}\d{2}|EM\d{2}[A-Z]{2,3}\d{2,3}|EI\d{2}[A-Z]{2}\d{2})\b/i;

export const BNCC_CODE_REGEX = new RegExp(BNCC_CODE_PATTERN.source, "gi");

export type ExtractedBnccSkill = {
  codigo: string;
  descricao?: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
};

export type ExtractBnccCodesResult = {
  codes: string[];
  skills: ExtractedBnccSkill[];
};

function normalizeCode(value: unknown): string | null {
  const text = String(value ?? "").trim().toUpperCase();
  if (!text) return null;

  const match = text.match(BNCC_CODE_PATTERN);
  const code = (match?.[1] || match?.[0] || text).toUpperCase();

  if (!BNCC_CODE_PATTERN.test(code)) {
    return null;
  }
  return code;
}

function collectCodesFromText(text: string, bucket: Set<string>): void {
  for (const match of text.matchAll(BNCC_CODE_REGEX)) {
    const code = match[1]?.toUpperCase();
    if (code) bucket.add(code);
  }
}

function readSkillRecord(value: unknown): ExtractedBnccSkill | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const codigo = normalizeCode(
    record.codigo ?? record.code ?? record.habilidadeBnccCodigo,
  );

  if (!codigo) return null;

  const descricao = String(
    record.habilidade ??
      record.descricao ??
      record.description ??
      record.habilidadeBncc ??
      "",
  ).trim();

  return {
    codigo,
    descricao: descricao || undefined,
    componente: record.componente ? String(record.componente).trim() : undefined,
    etapa: record.etapa ? String(record.etapa).trim() : undefined,
    anoSerie: record.anoSerie
      ? String(record.anoSerie).trim()
      : record.ano_serie
        ? String(record.ano_serie).trim()
        : undefined,
  };
}

function collectFromSkillsArray(
  value: unknown,
  codes: Set<string>,
  skills: Map<string, ExtractedBnccSkill>,
): void {
  if (!Array.isArray(value)) return;

  for (const item of value) {
    const skill = readSkillRecord(item);
    if (!skill) continue;

    codes.add(skill.codigo);
    if (!skills.has(skill.codigo)) {
      skills.set(skill.codigo, skill);
    }
  }
}

function collectCodesFromQuestoes(
  value: unknown,
  codes: Set<string>,
  skills: Map<string, ExtractedBnccSkill>,
): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  const record = value as Record<string, unknown>;

  for (const key of ["questoes", "atividades"]) {
    const group = record[key];
    if (!Array.isArray(group)) continue;

    for (const item of group) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;

      const code = normalizeCode(
        row.habilidadeBncc ??
          row.habilidadeBnccCodigo ??
          row.codigoBncc ??
          row.codigo,
      );
      if (code) {
        codes.add(code);
        if (!skills.has(code)) {
          skills.set(code, { codigo: code });
        }
      }

      if (Array.isArray(row.questoes)) {
        collectCodesFromQuestoes({ questoes: row.questoes }, codes, skills);
      }
    }
  }

  const metadata = record.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    collectFromSkillsArray(
      (metadata as Record<string, unknown>).bncc,
      codes,
      skills,
    );
  }
}

function walkUnknown(value: unknown, codes: Set<string>, depth = 0): void {
  if (depth > 8 || value == null) return;

  if (typeof value === "string") {
    collectCodesFromText(value, codes);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      walkUnknown(item, codes, depth + 1);
    }
    return;
  }

  if (typeof value === "object") {
    for (const [, nested] of Object.entries(value as Record<string, unknown>)) {
      walkUnknown(nested, codes, depth + 1);
    }
  }
}

export function extractBnccCodesFromPayload(payload: {
  habilidadesSelecionadas?: unknown;
  habilidadesBncc?: unknown;
  habilidadesBnccCodigos?: unknown;
  conteudos?: unknown;
  estrutura?: unknown;
  planejamento?: unknown;
  contentHtml?: unknown;
  contentPreview?: unknown;
  raw?: unknown;
}): ExtractBnccCodesResult {
  const codes = new Set<string>();
  const skills = new Map<string, ExtractedBnccSkill>();

  collectFromSkillsArray(payload.habilidadesSelecionadas, codes, skills);
  collectFromSkillsArray(payload.habilidadesBncc, codes, skills);

  if (Array.isArray(payload.habilidadesBnccCodigos)) {
    for (const code of payload.habilidadesBnccCodigos) {
      const normalized = normalizeCode(code);
      if (normalized) codes.add(normalized);
    }
  }

  for (const textSource of [payload.contentHtml, payload.contentPreview]) {
    if (typeof textSource === "string" && textSource.trim()) {
      collectCodesFromText(textSource, codes);
    }
  }

  const conteudos = payload.conteudos;
  if (Array.isArray(conteudos)) {
    for (const item of conteudos) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      collectFromSkillsArray(record.habilidades, codes, skills);
      collectFromSkillsArray(record.habilidadesBncc, codes, skills);

      if (Array.isArray(record.habilidadesBnccCodigos)) {
        for (const code of record.habilidadesBnccCodigos) {
          const normalized = normalizeCode(code);
          if (normalized) codes.add(normalized);
        }
      }
    }
  }

  const structures = [
    payload.estrutura,
    payload.planejamento,
    payload.raw,
  ];

  for (const structure of structures) {
    walkUnknown(structure, codes);
    collectCodesFromQuestoes(structure, codes, skills);
    collectFromSkillsArray(
      structure &&
        typeof structure === "object" &&
        !Array.isArray(structure)
        ? (structure as Record<string, unknown>).habilidadesBnccUtilizadas
        : null,
      codes,
      skills,
    );
    collectFromSkillsArray(
      structure &&
        typeof structure === "object" &&
        !Array.isArray(structure)
        ? (structure as Record<string, unknown>).habilidadesBncc
        : null,
      codes,
      skills,
    );
  }

  return {
    codes: Array.from(codes).sort(),
    skills: Array.from(skills.values()),
  };
}

export function extractBnccCodesFromJson(value: Json | unknown): string[] {
  return extractBnccCodesFromPayload({ raw: value }).codes;
}
