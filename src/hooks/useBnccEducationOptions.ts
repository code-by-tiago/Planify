"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  DEFAULT_MATERIAL_EDUCATION,
  getAreaOptions,
  getComponentOptions,
  getYearOptions,
  normalizeMaterialEducation,
  type MaterialEducationFields,
} from "@/lib/educacao/education-options";

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
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fields.etapa) params.set("stage", fields.etapa);
      if (fields.anoSerie) params.set("grade", fields.anoSerie);

      const response = await planifyAuthenticatedFetch(
        `/api/bncc/catalog/options${params.toString() ? `?${params.toString()}` : ""}`,
      );
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        options?: CatalogOptions;
      } | null;

      if (!response.ok || !data?.success || !data.options?.totalSkills) {
        setCatalog(EMPTY_OPTIONS);
        setUsingFallback(true);
        return;
      }

      setCatalog(data.options);
      setUsingFallback(false);
    } catch {
      setCatalog(EMPTY_OPTIONS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [fields.etapa, fields.anoSerie]);

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
      if (usingFallback) {
        onChange(normalizeMaterialEducation(fields, patch));
        return;
      }

      const next = { ...fields, ...patch };

      if (patch.etapa && !catalog.grades.includes(next.anoSerie)) {
        next.anoSerie = catalog.grades[0] || next.anoSerie;
      }

      if (
        patch.etapa ||
        (patch.anoSerie && !catalog.subjects.includes(next.componente))
      ) {
        if (!catalog.subjects.includes(next.componente)) {
          next.componente = catalog.subjects[0] || next.componente;
        }
      }

      if (
        patch.etapa &&
        catalog.knowledgeAreas.length > 0 &&
        !catalog.knowledgeAreas.includes(next.areaConhecimento)
      ) {
        next.areaConhecimento = catalog.knowledgeAreas[0] || next.areaConhecimento;
      }

      onChange(next);
    },
    [catalog, fields, onChange, usingFallback],
  );

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
