"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  DEFAULT_MATERIAL_EDUCATION,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";
import {
  applyEducationWithCatalogGuards,
  catalogScopeMatches,
  reconcileEducationWithCatalog,
  type CatalogScope,
} from "@/lib/educacao/catalog-education-guards";

type CatalogOptions = {
  stages: string[];
  grades: string[];
  subjects: string[];
  knowledgeAreas: string[];
  totalSkills: number;
};

const EMPTY_OPTIONS: CatalogOptions = {
  stages: [],
  grades: [],
  subjects: [],
  knowledgeAreas: [],
  totalSkills: 0,
};

export function useBnccEducationOptions(
  fields: MaterialEducationFields,
  onChange: (next: MaterialEducationFields) => void,
) {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogOptions>(EMPTY_OPTIONS);
  const [catalogScope, setCatalogScope] = useState<CatalogScope | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    const fetchScope: CatalogScope = {
      etapa: fields.etapa,
      anoSerie: fields.anoSerie,
      areaConhecimento: fields.areaConhecimento,
    };

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fetchScope.etapa) params.set("stage", fetchScope.etapa);
      if (fetchScope.anoSerie) params.set("grade", fetchScope.anoSerie);
      if (fetchScope.areaConhecimento) params.set("area", fetchScope.areaConhecimento);

      const response = await planifyAuthenticatedFetch(
        `/api/bncc/catalog/options${params.toString() ? `?${params.toString()}` : ""}`,
      );
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        options?: CatalogOptions;
      } | null;

      if (!response.ok || !data?.success || !data.options?.totalSkills) {
        setCatalog(EMPTY_OPTIONS);
        setCatalogScope(null);
        setUsingFallback(true);
        return;
      }

      setCatalog(data.options);
      setCatalogScope(fetchScope);
      setUsingFallback(false);
    } catch {
      setCatalog(EMPTY_OPTIONS);
      setCatalogScope(null);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [fields.etapa, fields.anoSerie, fields.areaConhecimento]);

  useEffect(() => {
    void load();
  }, [load]);

  const stageOptions = useMemo(() => {
    if (usingFallback || catalog.stages.length === 0) {
      return ["Ensino Fundamental", "Ensino Médio", "Educação Infantil", "EJA"];
    }
    return catalog.stages;
  }, [catalog.stages, usingFallback]);

  const yearOptions = useMemo(() => {
    if (usingFallback || catalog.grades.length === 0) {
      return getYearOptions(fields.etapa);
    }
    return catalog.grades;
  }, [catalog.grades, fields.etapa, usingFallback]);

  const areaOptions = useMemo(() => {
    if (usingFallback || catalog.knowledgeAreas.length === 0) {
      return getAreaOptions(fields.etapa);
    }
    return catalog.knowledgeAreas;
  }, [catalog.knowledgeAreas, fields.etapa, usingFallback]);

  const componentOptions = useMemo(() => {
    if (usingFallback || catalog.subjects.length === 0) {
      return getComponentOptions(fields.etapa, fields.areaConhecimento);
    }
    return catalog.subjects;
  }, [
    catalog.subjects,
    fields.areaConhecimento,
    fields.etapa,
    usingFallback,
  ]);

  const applyEducation = useCallback(
    (patch: Partial<MaterialEducationFields>) => {
      const next = applyEducationWithCatalogGuards(
        fields,
        patch,
        catalog,
        catalogScope,
        usingFallback,
      );
      onChange(next);
    },
    [catalog, catalogScope, fields, onChange, usingFallback],
  );

  useEffect(() => {
    const reconciled = reconcileEducationWithCatalog(
      fields,
      catalog,
      catalogScope,
      usingFallback,
    );
    if (reconciled) {
      onChange(reconciled);
    }
  }, [catalog, catalogScope, fields, onChange, usingFallback]);

  return {
    loading,
    usingFallback,
    totalSkills: catalog.totalSkills,
    stageOptions,
    yearOptions,
    areaOptions,
    componentOptions,
    applyEducation,
    reload: load,
  };
}

export function useBnccEducationFields(
  initial: MaterialEducationFields = DEFAULT_MATERIAL_EDUCATION,
) {
  const [fields, setFields] = useState(initial);
  const options = useBnccEducationOptions(fields, setFields);
  return { fields, setFields, ...options };
}
