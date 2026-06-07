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
      if (fields.areaConhecimento) params.set("area", fields.areaConhecimento);

      const response = await planifyAuthenticatedFetch(
        `/api/bncc/catalog/options${params.toString() ? `?${params.toString()}` : ""}`,
      );
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        options?: CatalogOptions;
      } | null;

      if (!response.ok || !data?.success || !data.options?.totalSkills) {
        // #region agent log
        fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "920c67" },
          body: JSON.stringify({
            sessionId: "920c67",
            runId: "pre-fix",
            hypothesisId: "E",
            location: "useBnccEducationOptions.ts:load:fallback",
            message: "catalog API failed or empty — using fallback",
            data: {
              ok: response.ok,
              success: data?.success,
              totalSkills: data?.options?.totalSkills ?? 0,
              etapa: fields.etapa,
              anoSerie: fields.anoSerie,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        setCatalog(EMPTY_OPTIONS);
        setUsingFallback(true);
        return;
      }

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "920c67" },
        body: JSON.stringify({
          sessionId: "920c67",
            runId: "post-fix",
            hypothesisId: "A,B,C,D",
            location: "useBnccEducationOptions.ts:load:success",
          message: "catalog API response",
          data: {
            etapa: fields.etapa,
            anoSerie: fields.anoSerie,
            areaConhecimento: fields.areaConhecimento,
            stagesCount: data.options.stages.length,
            stages: data.options.stages,
            gradesCount: data.options.grades.length,
            gradesSample: data.options.grades.slice(0, 15),
            subjectsCount: data.options.subjects.length,
            subjectsSample: data.options.subjects.slice(0, 20),
            areasCount: data.options.knowledgeAreas.length,
            areasSample: data.options.knowledgeAreas.slice(0, 10),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setCatalog(data.options);
      setUsingFallback(false);
    } catch {
      setCatalog(EMPTY_OPTIONS);
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
      const next = normalizeMaterialEducation(fields, patch);
      const componentBefore = fields.componente;

      if (!usingFallback) {
        if (catalog.grades.length > 0 && !catalog.grades.includes(next.anoSerie)) {
          next.anoSerie = catalog.grades[0] || next.anoSerie;
        }

        if (
          catalog.knowledgeAreas.length > 0 &&
          !catalog.knowledgeAreas.includes(next.areaConhecimento)
        ) {
          next.areaConhecimento = catalog.knowledgeAreas[0] || next.areaConhecimento;
          const components = getComponentOptions(next.etapa, next.areaConhecimento);
          next.componente = components[0] || next.componente;
        }

        if (catalog.subjects.length > 0 && !catalog.subjects.includes(next.componente)) {
          next.componente = catalog.subjects[0] || next.componente;
        }
      }

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "920c67" },
        body: JSON.stringify({
          sessionId: "920c67",
          runId: "post-fix",
          hypothesisId: "B,E",
          location: "useBnccEducationOptions.ts:applyEducation",
          message: "education field patch applied",
          data: {
            patch,
            componentBefore,
            componentAfter: next.componente,
            areaConhecimento: next.areaConhecimento,
            catalogSubjectsCount: catalog.subjects.length,
            catalogHasInfantilSubject: catalog.subjects.some((s) =>
              s.includes("eu, o outro"),
            ),
            areaInCatalog: catalog.knowledgeAreas.includes(next.areaConhecimento),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

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
