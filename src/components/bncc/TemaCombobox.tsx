"use client";

import { useEffect, useId, useRef, useState } from "react";
import { HUD_FIELD_CLASS, HUD_SECTION_LABEL } from "@/lib/pro/hud-form-styles";
import type { BnccTemaAutocompleteSuggestion } from "@/lib/bncc/bncc-tema-autocomplete";
import { useBnccTemaAutocomplete } from "@/lib/bncc/use-bncc-tema-autocomplete";

type TemaComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: BnccTemaAutocompleteSuggestion) => void;
  label: string;
  placeholder?: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  className?: string;
};

export function TemaCombobox({
  value,
  onChange,
  onSelectSuggestion,
  label,
  placeholder = "Digite o tema ou assunto da aula...",
  etapa,
  anoSerie,
  componente,
  className,
}: TemaComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { suggestions, loading, error, canSearch } = useBnccTemaAutocomplete({
    query: value,
    etapa,
    anoSerie,
    componente,
    enabled: open,
    debounceMs: 300,
  });

  const showPanel = open && (loading || error || canSearch);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  function selectSuggestion(suggestion: BnccTemaAutocompleteSuggestion) {
    onChange(suggestion.tema);
    onSelectSuggestion?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || suggestions.length === 0) {
      if (event.key === "ArrowDown" && canSearch) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        selectSuggestion(suggestion);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={rootRef} className={className}>
      <label className="block">
        <span className={HUD_SECTION_LABEL}>{label}</span>
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${HUD_FIELD_CLASS} mt-2`}
          role="combobox"
          aria-expanded={showPanel ? true : false}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </label>

      {showPanel ? (
        <div className="relative z-20">
          <ul
            id={listboxId}
            role="listbox"
            className="absolute mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-cyan-400/20 bg-white py-1 shadow-lg"
          >
            {loading ? (
              <li className="px-3 py-2 text-xs font-semibold text-slate-500">
                Buscando temas BNCC…
              </li>
            ) : error ? (
              <li className="px-3 py-2 text-xs font-semibold text-rose-700">
                {error}
              </li>
            ) : suggestions.length === 0 ? (
              <li className="px-3 py-2 text-xs font-semibold text-slate-500">
                {canSearch
                  ? "Nenhum tema BNCC encontrado para este filtro."
                  : "Digite pelo menos 2 caracteres para ver sugestões BNCC."}
              </li>
            ) : (
              suggestions.map((suggestion, index) => {
                const active = index === activeIndex;

                return (
                  <li key={suggestion.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition ${
                        active
                          ? "bg-cyan-50 text-slate-950"
                          : "text-slate-800 hover:bg-cyan-50/70"
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-950">
                        {suggestion.label}
                      </span>
                      {suggestion.habilidades[0] ? (
                        <span className="line-clamp-1 text-[11px] font-medium text-slate-500">
                          {suggestion.habilidades[0].codigo} —{" "}
                          {suggestion.habilidades[0].descricao}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
