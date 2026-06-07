import {
  normalizeMaterialEducation,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";

export type CatalogScope = {
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
};

export type CatalogGuardInput = {
  grades: string[];
  knowledgeAreas: string[];
  subjects: string[];
};

export function catalogScopeMatches(
  scope: CatalogScope | null,
  fields: MaterialEducationFields,
): boolean {
  return (
    scope !== null &&
    scope.etapa === fields.etapa &&
    scope.anoSerie === fields.anoSerie &&
    scope.areaConhecimento === fields.areaConhecimento
  );
}

export function applyEducationWithCatalogGuards(
  fields: MaterialEducationFields,
  patch: Partial<MaterialEducationFields>,
  catalog: CatalogGuardInput,
  catalogScope: CatalogScope | null,
  usingFallback: boolean,
): MaterialEducationFields {
  const next = normalizeMaterialEducation(fields, patch);

  if (usingFallback || !catalogScopeMatches(catalogScope, next)) {
    return next;
  }

  if (catalog.grades.length > 0 && !catalog.grades.includes(next.anoSerie)) {
    next.anoSerie = catalog.grades[0] || next.anoSerie;
  }

  if (
    catalog.knowledgeAreas.length > 0 &&
    !catalog.knowledgeAreas.includes(next.areaConhecimento)
  ) {
    next.areaConhecimento = catalog.knowledgeAreas[0] || next.areaConhecimento;
    next.componente = catalog.subjects[0] || next.componente;
  }

  if (catalog.subjects.length > 0 && !catalog.subjects.includes(next.componente)) {
    next.componente = catalog.subjects[0] || next.componente;
  }

  return next;
}

export function reconcileEducationWithCatalog(
  fields: MaterialEducationFields,
  catalog: CatalogGuardInput,
  catalogScope: CatalogScope | null,
  usingFallback: boolean,
): MaterialEducationFields | null {
  if (usingFallback || !catalogScopeMatches(catalogScope, fields)) {
    return null;
  }

  const next = normalizeMaterialEducation(fields);
  let changed = false;

  if (catalog.grades.length > 0 && !catalog.grades.includes(next.anoSerie)) {
    next.anoSerie = catalog.grades[0] || next.anoSerie;
    changed = true;
  }

  if (
    catalog.knowledgeAreas.length > 0 &&
    !catalog.knowledgeAreas.includes(next.areaConhecimento)
  ) {
    next.areaConhecimento = catalog.knowledgeAreas[0] || next.areaConhecimento;
    next.componente = catalog.subjects[0] || next.componente;
    changed = true;
  }

  if (catalog.subjects.length > 0 && !catalog.subjects.includes(next.componente)) {
    next.componente = catalog.subjects[0] || next.componente;
    changed = true;
  }

  return changed ? next : null;
}
