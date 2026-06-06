"use client";

import { useSchoolClasses } from "@/hooks/useSchoolClasses";
import {
  HUD_FIELD_CLASS,
  HUD_SECTION_LABEL,
} from "@/lib/pro/hud-form-styles";

type SchoolClassDisciplineFieldsProps = {
  school: ReturnType<typeof useSchoolClasses>;
};

export function SchoolClassDisciplineFields({
  school,
}: SchoolClassDisciplineFieldsProps) {
  if (school.loading) {
    return (
      <p className="text-xs font-semibold text-slate-400">
        Carregando turmas da escola…
      </p>
    );
  }

  if (!school.hasSchool) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={HUD_SECTION_LABEL}>Turma (opcional)</span>
          <select
            value=""
            disabled
            className={HUD_FIELD_CLASS}
          >
            <option value="">Autônomo — sem turma vinculada</option>
          </select>
        </label>
        <label>
          <span className={HUD_SECTION_LABEL}>Disciplina (opcional)</span>
          <input
            type="text"
            value={school.discipline}
            onChange={(event) => school.setDiscipline(event.target.value)}
            placeholder="Ex.: História, Matemática…"
            className={HUD_FIELD_CLASS}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label>
        <span className={HUD_SECTION_LABEL}>
          Turma <span className="text-rose-500">*</span>
        </span>
        <select
          value={school.classId || ""}
          onChange={(event) => school.setClassId(event.target.value)}
          required
          className={HUD_FIELD_CLASS}
        >
          <option value="">Selecione a turma</option>
          {school.classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
              {cls.grade_level ? ` · ${cls.grade_level}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className={HUD_SECTION_LABEL}>
          Disciplina <span className="text-rose-500">*</span>
        </span>
        {school.disciplineOptions.length > 0 ? (
          <select
            value={school.discipline}
            onChange={(event) => school.setDiscipline(event.target.value)}
            required
            className={HUD_FIELD_CLASS}
          >
            <option value="">Selecione a disciplina</option>
            {school.disciplineOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={school.discipline}
            onChange={(event) => school.setDiscipline(event.target.value)}
            placeholder="Ex.: História"
            required
            className={HUD_FIELD_CLASS}
          />
        )}
      </label>
    </div>
  );
}
