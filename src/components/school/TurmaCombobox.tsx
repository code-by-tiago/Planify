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
  return (
    <label className={className}>
      <span className={HUD_SECTION_LABEL}>Turma (opcional)</span>
      <input
        type="text"
        list={listId}
        value={school.turmaDisplayValue}
        onChange={(event) => school.setTurmaInput(event.target.value)}
        onBlur={() => {
          if (!school.hasSchool) {
            void school.rememberPersonalClass(school.className);
          }
        }}
        disabled={school.loading}
        placeholder={school.loading ? "Carregando turmas…" : school.placeholder}
        className={HUD_FIELD_CLASS}
        autoComplete="off"
      />
      <datalist id={listId}>
        {school.turmaSuggestions.map((item) => (
          <option key={item.key} value={item.label} />
        ))}
      </datalist>
    </label>
  );
}

/** @deprecated Use TurmaCombobox */
export const TurmaSelect = TurmaCombobox;
