import type {
  PlanejamentoAIInput,
  PlanejamentoAIOutput,
  PlanejamentoAIEtapa,
  SelectedBNCCSkill,
} from "../../types/ai";
import { generateGeminiJSON } from "./gemini-client";
import {
  buildPlanejamentoPrompt,
  buildPlanejamentoSystemInstruction,
} from "./prompts/planejamento-prompt";

const BNCC_CODE_REGEX = /\b(EF\d{2}[A-Z]{2}\d{2}|EM\d{2}[A-Z]{2,3}\d{2,3}|EI\d{2}[A-Z]{2}\d{2})\b/i;

function normalizeConteudos(conteudos: PlanejamentoAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) {
    return conteudos.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(conteudos)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractBnccCode(value: unknown): string {
  const text = String(value || "").trim().toUpperCase();
  const match = text.match(BNCC_CODE_REGEX);

  return match?.[1]?.toUpperCase() ?? text;
}

function formatOfficialSkillForTable(skill: SelectedBNCCSkill): string {
  return `${skill.codigo} — ${skill.habilidade}`;
}

function sanitizeSkill(skill: SelectedBNCCSkill): SelectedBNCCSkill | null {
  const codigo = extractBnccCode(skill.codigo);
  const habilidade = String(skill.habilidade || "").trim();

  if (!codigo || !habilidade) {
    return null;
  }

  return {
    codigo,
    habilidade,
    componente: skill.componente ? String(skill.componente).trim() : undefined,
    etapa: skill.etapa ? String(skill.etapa).trim() : undefined,
    anoSerie: skill.anoSerie ? String(skill.anoSerie).trim() : undefined,
  };
}

function deduplicateSkills(skills: SelectedBNCCSkill[]): SelectedBNCCSkill[] {
  const map = new Map<string, SelectedBNCCSkill>();

  for (const skill of skills) {
    const sanitized = sanitizeSkill(skill);

    if (sanitized && !map.has(sanitized.codigo)) {
      map.set(sanitized.codigo, sanitized);
    }
  }

  return Array.from(map.values());
}

function validateInput(input: PlanejamentoAIInput): string | null {
  if (!input) {
    return "Dados do planejamento não foram enviados.";
  }

  if (!String(input.escola || "").trim()) {
    return "Informe a escola.";
  }

  if (!String(input.professor || "").trim()) {
    return "Informe o professor.";
  }

  if (!String(input.etapa || "").trim()) {
    return "Informe a etapa.";
  }

  if (!String(input.anoSerie || "").trim()) {
    return "Informe o ano/série.";
  }

  if (!String(input.componenteCurricular || "").trim()) {
    return "Informe o componente curricular.";
  }

  if (!String(input.cargaHoraria || "").trim()) {
    return "Informe a carga horária.";
  }

  if (normalizeConteudos(input.conteudos).length === 0) {
    return "Informe ao menos um conteúdo.";
  }

  if (!Array.isArray(input.habilidadesSelecionadas)) {
    return "Envie as habilidades BNCC selecionadas.";
  }

  if (deduplicateSkills(input.habilidadesSelecionadas).length === 0) {
    return "Selecione ao menos uma habilidade BNCC oficial antes de gerar com IA.";
  }

  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function getRawCodesFromEtapa(value: Partial<PlanejamentoAIEtapa>): string[] {
  const fromCodigos = normalizeStringArray(value.habilidadesBnccCodigos);
  const fromHabilidades = normalizeStringArray(value.habilidadesBncc);

  return [...fromCodigos, ...fromHabilidades];
}

function normalizeEtapa(value: Partial<PlanejamentoAIEtapa>): PlanejamentoAIEtapa {
  return {
    titulo: String(value.titulo || "Etapa pedagógica").trim(),
    descricao: String(value.descricao || "").trim(),
    conteudos: normalizeStringArray(value.conteudos),
    habilidadesBnccCodigos: getRawCodesFromEtapa(value).map(extractBnccCode).filter(Boolean),
    habilidadesBncc: [],
    metodologia: String(value.metodologia || "").trim(),
    recursos: normalizeStringArray(value.recursos),
    avaliacao: String(value.avaliacao || "").trim(),
    evidencias: normalizeStringArray(value.evidencias),
  };
}

function ensureOnlySelectedBNCCAndFillOfficialDescriptions(
  output: PlanejamentoAIOutput,
  selectedSkills: SelectedBNCCSkill[],
): PlanejamentoAIOutput {
  const officialSkillByCode = new Map<string, SelectedBNCCSkill>();
  const warnings: string[] = [];

  for (const skill of selectedSkills) {
    officialSkillByCode.set(skill.codigo, skill);
  }

  const habilidadesBnccUtilizadas = output.habilidadesBnccUtilizadas
    .map((skill) => officialSkillByCode.get(extractBnccCode(skill.codigo)))
    .filter((skill): skill is SelectedBNCCSkill => Boolean(skill));

  const etapas = output.etapas.map((rawEtapa) => {
    const etapa = normalizeEtapa(rawEtapa);
    const uniqueCodes = new Set<string>();

    for (const rawCode of etapa.habilidadesBnccCodigos) {
      const code = extractBnccCode(rawCode);

      if (officialSkillByCode.has(code)) {
        uniqueCodes.add(code);
      } else {
        warnings.push(`A IA tentou citar uma habilidade não selecionada na etapa "${etapa.titulo}": ${rawCode}. Ela foi removida.`);
      }
    }

    const habilidadesBnccCodigos = Array.from(uniqueCodes);
    const habilidadesBncc = habilidadesBnccCodigos
      .map((code) => officialSkillByCode.get(code))
      .filter((skill): skill is SelectedBNCCSkill => Boolean(skill))
      .map(formatOfficialSkillForTable);

    return {
      ...etapa,
      habilidadesBnccCodigos,
      habilidadesBncc,
    };
  });

  return {
    ...output,
    habilidadesBnccUtilizadas:
      habilidadesBnccUtilizadas.length > 0 ? habilidadesBnccUtilizadas : selectedSkills,
    etapas,
    alertas: [...(output.alertas || []), ...warnings],
  };
}

function normalizeOutput(
  output: PlanejamentoAIOutput,
  input: PlanejamentoAIInput,
  selectedSkills: SelectedBNCCSkill[],
): PlanejamentoAIOutput {
  return {
    titulo: output.titulo || `Planejamento de ${input.componenteCurricular}`,
    resumo: output.resumo || "Planejamento gerado com base nos dados informados.",
    dadosGerais: {
      escola: input.escola,
      professor: input.professor,
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      componenteCurricular: input.componenteCurricular,
      cargaHoraria: input.cargaHoraria,
      tipo: input.tipo,
      trimestre: input.trimestre || "",
    },
    objetivosGerais: Array.isArray(output.objetivosGerais)
      ? output.objetivosGerais
      : [],
    habilidadesBnccUtilizadas: Array.isArray(output.habilidadesBnccUtilizadas)
      ? output.habilidadesBnccUtilizadas
      : selectedSkills,
    conteudosOrganizados: Array.isArray(output.conteudosOrganizados)
      ? output.conteudosOrganizados
      : normalizeConteudos(input.conteudos),
    metodologiaGeral: output.metodologiaGeral || "",
    etapas: Array.isArray(output.etapas) ? output.etapas.map(normalizeEtapa) : [],
    recursosGerais: Array.isArray(output.recursosGerais) ? output.recursosGerais : [],
    avaliacaoGeral: output.avaliacaoGeral || "",
    evidenciasDeAprendizagem: Array.isArray(output.evidenciasDeAprendizagem)
      ? output.evidenciasDeAprendizagem
      : [],
    observacoesPedagogicas: Array.isArray(output.observacoesPedagogicas)
      ? output.observacoesPedagogicas
      : [],
    proximosPassos: Array.isArray(output.proximosPassos)
      ? output.proximosPassos
      : [],
    alertas: Array.isArray(output.alertas) ? output.alertas : [],
  };
}

export async function generatePlanejamentoWithAI(
  rawInput: PlanejamentoAIInput,
): Promise<PlanejamentoAIOutput> {
  const validationError = validateInput(rawInput);

  if (validationError) {
    throw new Error(validationError);
  }

  const selectedSkills = deduplicateSkills(rawInput.habilidadesSelecionadas);
  const input: PlanejamentoAIInput = {
    ...rawInput,
    conteudos: normalizeConteudos(rawInput.conteudos),
    habilidadesSelecionadas: selectedSkills,
  };

  const generated = await generateGeminiJSON<PlanejamentoAIOutput>({
    systemInstruction: buildPlanejamentoSystemInstruction(),
    prompt: buildPlanejamentoPrompt(input),
    temperature: 0.15,
    topP: 0.7,
    maxOutputTokens: 8192,
  });

  const normalized = normalizeOutput(generated, input, selectedSkills);

  return ensureOnlySelectedBNCCAndFillOfficialDescriptions(normalized, selectedSkills);
}
