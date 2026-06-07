export type BnccPayloadStage =
  | "ensino_medio"
  | "ensino_fundamental"
  | "educacao_infantil"
  | null;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isHighSchoolFields(etapa: string, anoSerie: string): boolean {
  const value = `${etapa} ${anoSerie}`;

  return (
    value.includes("ensino medio") ||
    value.includes("medio") ||
    /\b[123]\s*(?:a\s*)?serie\b/.test(value) ||
    value.includes("1ª serie") ||
    value.includes("2ª serie") ||
    value.includes("3ª serie")
  );
}

export function resolveBnccStageFromFields(
  etapa?: string | null,
  anoSerie?: string | null,
): BnccPayloadStage {
  const etapaNorm = normalizeSearch(String(etapa || ""));
  const anoNorm = normalizeSearch(String(anoSerie || ""));

  if (etapaNorm.includes("medio")) {
    return "ensino_medio";
  }

  if (etapaNorm.includes("fundamental")) {
    return "ensino_fundamental";
  }

  if (etapaNorm.includes("infantil")) {
    return "educacao_infantil";
  }

  if (etapaNorm.includes("eja")) {
    return null;
  }

  if (isHighSchoolFields(etapaNorm, anoNorm)) {
    return "ensino_medio";
  }

  if (/\b([1-9])\D{0,3}ano\b/.test(anoNorm)) {
    return "ensino_fundamental";
  }

  return null;
}

export function bnccCodeMatchesStage(
  code: string,
  stage: BnccPayloadStage,
): boolean {
  if (!stage) {
    return true;
  }

  const normalized = code.toUpperCase();

  if (stage === "ensino_medio") {
    return normalized.startsWith("EM");
  }

  if (stage === "ensino_fundamental") {
    return normalized.startsWith("EF");
  }

  if (stage === "educacao_infantil") {
    return normalized.startsWith("EI");
  }

  return true;
}

export function filterBnccCodesByStage(
  codes: string[],
  etapa?: string | null,
  anoSerie?: string | null,
): string[] {
  const stage = resolveBnccStageFromFields(etapa, anoSerie);

  if (!stage) {
    return codes;
  }

  return codes.filter((code) => bnccCodeMatchesStage(code, stage));
}
