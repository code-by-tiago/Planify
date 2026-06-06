"use client";

import type { UseSchoolClassesReturn } from "@/hooks/useSchoolClasses";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
} from "@/lib/pro/hud-form-styles";

type TurmaComboboxProps = {
  school: UseSchoolClassesReturn;
  className?: string;
  listId?: string;
};

export function TurmaCombobox({
  school,
  className,
  listId = "planify-turma-suggestions",
}: TurmaComboboxProps) {
  if (school.hasSchool) {
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
            {school.loading ? "Carregando turmas…" : school.placeholder}
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

  return (
    <label className={className}>
      <span className={HUD_SECTION_LABEL}>Turma (opcional)</span>
      <input
        type="text"
        list={listId}
        value={school.className}
        onChange={(event) => school.setClassName(event.target.value)}
        onBlur={() => {
          void school.rememberPersonalClass(school.className);
        }}
        disabled={school.loading}
        placeholder={school.loading ? "Carregando turmas…" : school.placeholder}
        className={HUD_FIELD_CLASS}
        autoComplete="off"
      />
      <datalist id={listId}>
        {school.personalClasses.map((cls) => (
          <option key={cls.id} value={cls.name} />
        ))}
      </datalist>
    </label>
  );
}

/** @deprecated Use TurmaCombobox */
export const TurmaSelect = TurmaCombobox;
