"use client";

import type { useSchoolClasses } from "@/hooks/useSchoolClasses";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
} from "@/lib/pro/hud-form-styles";

type TurmaSelectProps = {
  school: ReturnType<typeof useSchoolClasses>;
  className?: string;
};

export function TurmaSelect({ school, className }: TurmaSelectProps) {
  return (
    <label className={className}>
      <span className={HUD_SECTION_LABEL}>Turma (opcional)</span>
      <select
        value={school.classId || ""}
        onChange={(event) => school.setClassId(event.target.value)}
        disabled={school.loading}
        className={HUD_FIELD_CLASS}
      >
        <option value="">
          {school.loading ? "Carregando turmas…" : "Autônomo — sem turma vinculada"}
        </option>
        {school.classes.map((cls) => (
          <option key={cls.id} value={cls.id}>
            {cls.name}
            {cls.grade_level ? ` · ${cls.grade_level}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
