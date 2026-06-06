"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { SchoolContext } from "@/types/school";

export type SchoolClassOption = SchoolContext["classes"][number];

export function useSchoolClasses() {
  const [loading, setLoading] = useState(true);
  const [hasSchool, setHasSchool] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClassOption[]>([]);
  const [classId, setClassId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
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
        return;
      }

      setHasSchool(Boolean(data.school));
      setSchoolName(data.school?.name || null);
      setClasses(data.classes || []);
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

  const selectedClass = useMemo(
    () => classes.find((row) => row.id === classId) || null,
    [classes, classId],
  );

  const handleClassChange = useCallback((value: string) => {
    setClassId(value || null);
  }, []);

  return {
    loading,
    hasSchool,
    schoolName,
    classes,
    classId,
    setClassId: handleClassChange,
    selectedClass,
    reload: load,
  };
}
