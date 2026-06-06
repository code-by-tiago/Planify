"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { SchoolContext } from "@/types/school";

export type SchoolClassOption = SchoolContext["classes"][number];

export type PersonalClassOption = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type TurmaPayload = {
  classId: string | null;
  className: string | null;
  turma?: string;
};

const TURMA_PLACEHOLDER = "Digite ou selecione uma turma (opcional)";

export function useSchoolClasses() {
  const [loading, setLoading] = useState(true);
  const [hasSchool, setHasSchool] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [personalClasses, setPersonalClasses] = useState<PersonalClassOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState("");

  const loadSchool = useCallback(async () => {
    const response = await planifyAuthenticatedFetch("/api/me/school");
    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      school?: { name?: string } | null;
      classes?: SchoolClassOption[];
    } | null;

    if (!response.ok || !data?.success) {
      setHasSchool(false);
      setSchoolName(null);
      setClasses([]);
      return false;
    }

    const linked = Boolean(data.school);
    setHasSchool(linked);
    setSchoolName(data.school?.name || null);
    setClasses(data.classes || []);

    if (linked) {
      setClassName("");
    }

    return linked;
  }, []);

  const loadPersonalClasses = useCallback(async () => {
    const response = await planifyAuthenticatedFetch("/api/me/classes");
    const data = (await response.json().catch(() => null)) as {
      success?: boolean;
      classes?: PersonalClassOption[];
    } | null;

    if (!response.ok || !data?.success) {
      setPersonalClasses([]);
      return;
    }

    setPersonalClasses(data.classes || []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const linked = await loadSchool();
      if (!linked) {
        await loadPersonalClasses();
      } else {
        setPersonalClasses([]);
      }
    } catch {
      setHasSchool(false);
      setSchoolName(null);
      setClasses([]);
      setPersonalClasses([]);
    } finally {
      setLoading(false);
    }
  }, [loadPersonalClasses, loadSchool]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedClass = useMemo(
    () => classes.find((row) => row.id === classId) || null,
    [classes, classId],
  );

  const handleClassIdChange = useCallback((value: string) => {
    setClassId(value || null);
    setClassName("");
  }, []);

  const handleClassNameChange = useCallback((value: string) => {
    setClassName(value);
    setClassId(null);
  }, []);

  const turmaPayload = useMemo((): TurmaPayload => {
    if (hasSchool) {
      const turma = selectedClass?.name?.trim() || undefined;
      return {
        classId: classId || null,
        className: null,
        turma,
      };
    }

    const trimmed = className.trim();
    return {
      classId: null,
      className: trimmed || null,
      turma: trimmed || undefined,
    };
  }, [classId, className, hasSchool, selectedClass?.name]);

  const rememberPersonalClass = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || hasSchool) {
      return;
    }

    const response = await planifyAuthenticatedFetch("/api/me/classes", {
      method: "POST",
      body: JSON.stringify({ name: trimmed }),
    });

    if (!response.ok) {
      return;
    }

    await loadPersonalClasses();
  }, [hasSchool, loadPersonalClasses]);

  return {
    loading,
    hasSchool,
    schoolName,
    classes,
    personalClasses,
    classId,
    className,
    setClassId: handleClassIdChange,
    setClassName: handleClassNameChange,
    selectedClass,
    turmaPayload,
    rememberPersonalClass,
    placeholder: TURMA_PLACEHOLDER,
    reload: load,
  };
}

export type UseSchoolClassesReturn = ReturnType<typeof useSchoolClasses>;
