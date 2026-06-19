"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildTeachingContextFromFields,
  isTeachingContextConfigured,
  loadTeacherTeachingContext,
  saveTeacherTeachingContext,
  syncTeacherTeachingContextFromServer,
} from "@/lib/auth/teaching-context-storage";
import type {
  TeacherTeachingContext,
  TeachingContextFields,
} from "@/types/teaching-context";

export function useTeacherTeachingContext() {
  const [context, setContext] = useState<TeacherTeachingContext>(
    loadTeacherTeachingContext,
  );
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void syncTeacherTeachingContextFromServer().then((next) => {
      if (cancelled) return;
      setContext(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const configured = useMemo(
    () => isTeachingContextConfigured(context),
    [context],
  );

  const saveFromFields = useCallback((fields: TeachingContextFields) => {
    const next = buildTeachingContextFromFields(fields);
    if (!isTeachingContextConfigured(next)) {
      return;
    }
    saveTeacherTeachingContext(next);
    setContext(next);
  }, []);

  const applyToForm = useCallback(
    (
      applyFields: (fields: TeachingContextFields) => void,
    ): boolean => {
      if (!configured) return false;

      applyFields({
        etapa: context.etapa,
        anoSerie: context.anoSerie,
        areaConhecimento: context.areaConhecimento,
        componente: context.componente,
        turma: context.turma,
        classId: context.classId,
        observacoesTurma: context.observacoesTurma,
      });
      setApplied(true);
      return true;
    },
    [configured, context],
  );

  const saveCurrentAsDefault = useCallback(
    (fields: TeachingContextFields) => {
      saveFromFields(fields);
      setApplied(true);
    },
    [saveFromFields],
  );

  const resetApplied = useCallback(() => {
    setApplied(false);
  }, []);

  return {
    context,
    loading,
    configured,
    applied,
    applyToForm,
    saveCurrentAsDefault,
    resetApplied,
  };
}

export type UseTeacherTeachingContextReturn = ReturnType<
  typeof useTeacherTeachingContext
>;
