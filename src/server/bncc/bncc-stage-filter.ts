import type { ExtractBnccCodesResult } from "./extract-bncc-codes";

export {
  bnccCodeMatchesStage,
  filterBnccCodesByStage,
  resolveBnccStageFromFields,
  type BnccPayloadStage,
} from "@/lib/bncc/bncc-stage-filter";

import {
  bnccCodeMatchesStage,
  resolveBnccStageFromFields,
} from "@/lib/bncc/bncc-stage-filter";

export function filterExtractedBnccByStage(
  extracted: ExtractBnccCodesResult,
  etapa?: string | null,
  anoSerie?: string | null,
): ExtractBnccCodesResult {
  const stage = resolveBnccStageFromFields(etapa, anoSerie);

  if (!stage) {
    return extracted;
  }

  const allowedCodes = new Set(
    extracted.codes.filter((code) => bnccCodeMatchesStage(code, stage)),
  );

  return {
    codes: Array.from(allowedCodes).sort(),
    skills: extracted.skills.filter((skill) =>
      allowedCodes.has(skill.codigo.toUpperCase()),
    ),
  };
}
