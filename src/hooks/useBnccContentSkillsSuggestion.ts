"use client";

import { useCallback, useState } from "react";
import type { BnccTemaAutocompleteSuggestion } from "@/lib/bncc/bncc-tema-autocomplete";
import {
  groupBnccSkillsFromResponse,
  normalizeBnccSkillOption,
  splitTopicLines,
  type BnccSkillGroup,
  type BnccSkillOption,
} from "@/lib/bncc/bncc-suggestion-ui";

export type BnccSuggestionBasePayload = {
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
};

type UseBnccContentSkillsSuggestionOptions = {
  basePayload: BnccSuggestionBasePayload;
  getConteudosText: () => string;
  onError?: (message: string) => void;
  onStatus?: (message: string) => void;
};

export function useBnccContentSkillsSuggestion({
  basePayload,
  getConteudosText,
  onError,
  onStatus,
}: UseBnccContentSkillsSuggestionOptions) {
  const [groups, setGroups] = useState<BnccSkillGroup[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<BnccSkillOption[]>([]);
  const [loadingBncc, setLoadingBncc] = useState(false);
  const [refreshingConteudo, setRefreshingConteudo] = useState<string | null>(null);
  const [contentRefreshOffsets, setContentRefreshOffsets] = useState<
    Record<string, number>
  >({});

  const reset = useCallback(() => {
    setGroups([]);
    setSelectedSkills([]);
    setContentRefreshOffsets({});
    setRefreshingConteudo(null);
  }, []);

  const toggleSkill = useCallback((skill: BnccSkillOption) => {
    setSelectedSkills((current) => {
      const exists = current.some((item) => item.id === skill.id);
      return exists
        ? current.filter((item) => item.id !== skill.id)
        : [...current, skill];
    });
  }, []);

  const selectGroup = useCallback((group: BnccSkillGroup) => {
    setSelectedSkills((current) => {
      const map = new Map(current.map((skill) => [skill.id, skill]));
      for (const skill of group.habilidades.slice(0, 3)) {
        map.set(skill.id, skill);
      }
      return Array.from(map.values());
    });
  }, []);

  const clearGroup = useCallback((group: BnccSkillGroup) => {
    setSelectedSkills((current) =>
      current.filter(
        (skill) => !group.habilidades.some((item) => item.id === skill.id),
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSkills([]);
  }, []);

  const applyTemaSuggestion = useCallback(
    (suggestion: BnccTemaAutocompleteSuggestion) => {
      const habilidades = suggestion.habilidades.map((skill) =>
        normalizeBnccSkillOption(skill, suggestion.tema),
      );

      setGroups([{ conteudo: suggestion.tema, habilidades }]);
      setSelectedSkills(habilidades.slice(0, 3));
      setContentRefreshOffsets({});
      onStatus?.("Tema BNCC selecionado. Revise as habilidades sugeridas.");
    },
    [onStatus],
  );

  const suggestBncc = useCallback(async () => {
    onError?.("");

    const conteudosText = getConteudosText().trim();

    if (!conteudosText) {
      onError?.("Informe os conteúdos na caixa Conteúdos antes de sugerir BNCC.");
      return;
    }

    const topicLines = splitTopicLines(conteudosText);

    setLoadingBncc(true);
    onStatus?.("Buscando habilidades BNCC pelos conteúdos...");

    try {
      const response = await fetch("/api/bncc/sugerir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basePayload,
          conteudos: conteudosText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error?.message || "Não foi possível sugerir habilidades BNCC.",
        );
      }

      const nextGroups = groupBnccSkillsFromResponse(data, topicLines);

      setGroups(nextGroups);
      setSelectedSkills([]);
      setContentRefreshOffsets({});
      onStatus?.(
        "Habilidades sugeridas. Escolha manualmente quais entrarão no PEI.",
      );
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : "Erro ao sugerir habilidades BNCC.",
      );
      onStatus?.("Erro na sugestão");
    } finally {
      setLoadingBncc(false);
    }
  }, [basePayload, getConteudosText, onError, onStatus]);

  const refreshContentBncc = useCallback(
    async (group: BnccSkillGroup) => {
      onError?.("");

      const excludeCodigos = group.habilidades
        .map((skill) => skill.codigo.trim())
        .filter(Boolean);
      const nextOffset = (contentRefreshOffsets[group.conteudo] ?? 0) + 1;

      setRefreshingConteudo(group.conteudo);
      onStatus?.(`Buscando outras opções para: ${group.conteudo}`);

      try {
        const response = await fetch("/api/bncc/sugerir", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            etapa: basePayload.etapa,
            anoSerie: basePayload.anoSerie,
            areaConhecimento: basePayload.areaConhecimento,
            componenteCurricular: basePayload.componenteCurricular,
            conteudos: group.conteudo,
            refresh: true,
            excludeCodigos,
            offset: nextOffset,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.error?.message ||
              "Não foi possível buscar outras habilidades BNCC.",
          );
        }

        const refreshedGroups = groupBnccSkillsFromResponse(data, [group.conteudo]);
        const refreshed =
          refreshedGroups.find((item) => item.conteudo === group.conteudo) ??
          refreshedGroups[0];

        if (!refreshed?.habilidades.length) {
          onError?.(
            String(data?.message || "Sem outras opções compatíveis com este conteúdo."),
          );
          onStatus?.("Sem outras opções compatíveis");
          return;
        }

        const replacedCodes = new Set(group.habilidades.map((skill) => skill.codigo));
        const newCodes = new Set(refreshed.habilidades.map((skill) => skill.codigo));

        setGroups((current) =>
          current.map((item) =>
            item.conteudo === group.conteudo
              ? { conteudo: group.conteudo, habilidades: refreshed.habilidades }
              : item,
          ),
        );

        setSelectedSkills((current) =>
          current.filter(
            (skill) =>
              skill.conteudo !== group.conteudo ||
              !replacedCodes.has(skill.codigo) ||
              newCodes.has(skill.codigo),
          ),
        );

        setContentRefreshOffsets((current) => ({
          ...current,
          [group.conteudo]: nextOffset,
        }));

        onStatus?.(
          refreshed.habilidades.length < 3
            ? `Foram encontradas ${refreshed.habilidades.length} alternativa(s) compatíveis com este conteúdo.`
            : "Novas opções carregadas para este conteúdo. Escolha as habilidades desejadas.",
        );
      } catch (err) {
        onError?.(
          err instanceof Error
            ? err.message
            : "Erro ao buscar outras habilidades BNCC.",
        );
        onStatus?.("Erro na sugestão");
      } finally {
        setRefreshingConteudo(null);
      }
    },
    [basePayload, contentRefreshOffsets, onError, onStatus],
  );

  return {
    groups,
    selectedSkills,
    loadingBncc,
    refreshingConteudo,
    suggestBncc,
    refreshContentBncc,
    toggleSkill,
    selectGroup,
    clearGroup,
    clearAll,
    applyTemaSuggestion,
    reset,
  };
}
