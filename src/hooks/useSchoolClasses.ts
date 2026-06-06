"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SchoolContext } from "@/types/school";

export type SchoolClassOption = SchoolContext["classes"][number];

export type SchoolGenerationFields = {
  classId: string | null;
  discipline: string;
};

export function useSchoolClasses() {
  const [loading, setLoading] = useState(true);
  const [hasSchool, setHasSchool] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [discipline, setDiscipline] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/me/school", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        school?: { name?: string } | null;
        classes?: SchoolClassOption[];
      } | null;

      if (!response.ok || !data?.success) {
        setHasSchool(false);
        setSchoolName(null);
        setClasses([]);
        return;
      }

      const schoolClasses = data.classes || [];
      setHasSchool(Boolean(data.school));
      setSchoolName(data.school?.name || null);
      setClasses(schoolClasses);
    } catch {
      setHasSchool(false);
      setSchoolName(null);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const disciplineOptions = useMemo(() => {
    const values = new Set<string>();
    for (const cls of classes) {
      const value = String(cls.discipline || "").trim();
      if (value) values.add(value);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [classes]);

  const selectedClass = useMemo(
    () => classes.find((row) => row.id === classId) || null,
    [classes, classId],
  );

  const handleClassChange = useCallback(
    (value: string) => {
      if (!value) {
        setClassId(null);
        return;
      }
      setClassId(value);
      const cls = classes.find((row) => row.id === value);
      if (cls?.discipline?.trim()) {
        setDiscipline(cls.discipline.trim());
      }
    },
    [classes],
  );

  const validate = useCallback((): string | null => {
    if (hasSchool && !classId) {
      return "Selecione a turma antes de gerar.";
    }
    if (hasSchool && !discipline.trim()) {
      return "Selecione a disciplina antes de gerar.";
    }
    return null;
  }, [hasSchool, classId, discipline]);

  const generationFields = useMemo<SchoolGenerationFields>(
    () => ({
      classId,
      discipline: discipline.trim(),
    }),
    [classId, discipline],
  );

  return {
    loading,
    hasSchool,
    schoolName,
    classes,
    classId,
    setClassId: handleClassChange,
    discipline,
    setDiscipline,
    disciplineOptions,
    selectedClass,
    validate,
    generationFields,
    reload: load,
  };
}
