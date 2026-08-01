import "server-only";

import { readBNCCSkills } from "./bncc-service";
import { BNCC_CODE_PATTERN } from "./extract-bncc-codes";

let cachedCodeSet: Set<string> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getBnccCodeSet(): Promise<Set<string>> {
  if (cachedCodeSet && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedCodeSet;
  }

  const skills = await readBNCCSkills();
  cachedCodeSet = new Set(
    skills.map((skill) => String(skill.codigo || "").trim().toUpperCase()).filter(Boolean),
  );
  cacheLoadedAt = Date.now();
  return cachedCodeSet;
}

export async function validateBnccCodesAgainstDb(codes: string[]): Promise<{
  valid: string[];
  invalid: string[];
}> {
  const codeSet = await getBnccCodeSet();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const raw of codes) {
    const code = String(raw || "").trim().toUpperCase();
    if (!code || !BNCC_CODE_PATTERN.test(code)) {
      if (code) invalid.push(code);
      continue;
    }
    if (codeSet.has(code)) valid.push(code);
    else invalid.push(code);
  }

  return { valid, invalid };
}

export async function filterBnccCodesAgainstDb(codes: string[]): Promise<string[]> {
  const { valid } = await validateBnccCodesAgainstDb(codes);
  return [...new Set(valid)].sort();
}

export type BnccSkillLike = {
  codigo: string;
  descricao?: string;
  habilidade?: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo?: string;
};

export async function filterHabilidadesSelecionadasAgainstDb<T extends BnccSkillLike>(
  skills: T[] | undefined | null,
): Promise<T[]> {
  if (!Array.isArray(skills) || skills.length === 0) return [];
  const codeSet = await getBnccCodeSet();

  return skills.filter((skill) => {
    const code = String(skill.codigo || "").trim().toUpperCase();
    return Boolean(code) && codeSet.has(code);
  });
}

export async function assertHabilidadesSelecionadasAgainstDb(
  skills: BnccSkillLike[] | undefined | null,
  options?: { min?: number },
): Promise<string | null> {
  const min = options?.min ?? 1;
  const filtered = await filterHabilidadesSelecionadasAgainstDb(skills);
  if (filtered.length < min) {
    return "Selecione habilidades BNCC válidas do catálogo oficial.";
  }
  return null;
}
