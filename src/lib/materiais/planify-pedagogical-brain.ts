import pedagogicalBrain from "../../../data/planify-pedagogical-brain/pedagogical-brain.json";
import questionModels from "../../../data/planify-pedagogical-brain/question-models.json";
import disciplineLenses from "../../../data/planify-pedagogical-brain/discipline-lenses.json";
import gradeProgression from "../../../data/planify-pedagogical-brain/grade-progression.json";
import rubrics from "../../../data/planify-pedagogical-brain/rubrics.json";
import methodologies from "../../../data/planify-pedagogical-brain/methodologies.json";
import qualityRules from "../../../data/planify-pedagogical-brain/quality-rules.json";
import waitingMessages from "../../../data/planify-pedagogical-brain/waiting-messages.json";
import sourcePolicy from "../../../data/planify-pedagogical-brain/source-policy.json";

export type PlanifyBrainInput = {
  tipo: string;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  tema: string;
  quantidadeQuestoes?: string | number;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMaterialTypeKey(tipo: string): string {
  const normalized = normalize(tipo);
  if (normalized.includes("exercicio")) return "exercicios";
  if (normalized.includes("atividade")) return "atividade";
  if (normalized.includes("lista")) return "lista";
  if (normalized.includes("prova") || normalized.includes("avaliacao")) return "prova";
  if (normalized.includes("apostila")) return "apostila";
  if (normalized.includes("revisao")) return "revisao";
  if (normalized.includes("sequencia")) return "sequencia";
  if (normalized.includes("projeto")) return "projeto";
  if (normalized.includes("roteiro")) return "roteiro";
  if (normalized.includes("jogo")) return "jogo";
  return "atividade";
}

function getDisciplineKey(component: string): string {
  const normalized = normalize(component);
  if (normalized.includes("matematica")) return "Matemática";
  if (normalized.includes("ciencias") || normalized.includes("biologia") || normalized.includes("fisica") || normalized.includes("quimica")) return "Ciências";
  if (normalized.includes("historia")) return "História";
  if (normalized.includes("geografia")) return "Geografia";
  if (normalized.includes("filosofia")) return "Filosofia";
  if (normalized.includes("sociologia")) return "Sociologia";
  if (normalized.includes("arte")) return "Arte";
  if (normalized.includes("educacao fisica")) return "Educação Física";
  if (normalized.includes("ingles") || normalized.includes("espanh")) return "Língua Estrangeira";
  return "Língua Portuguesa";
}

function getLevelKey(etapa: string, anoSerie: string): string {
  const level = normalize(`${etapa} ${anoSerie}`);
  if (level.includes("infantil")) return "Educação Infantil";
  if (level.includes("medio") || level.includes("3 serie") || level.includes("2 serie") || level.includes("1 serie")) return "Ensino Médio";
  if (["1", "2", "3", "4", "5"].some((year) => level.includes(`${year} ano`) || level.includes(`${year}o ano`))) return "Fundamental 1";
  return "Fundamental 2";
}

export function getPlanifyPedagogicalContract(input: PlanifyBrainInput) {
  const materialKey = getMaterialTypeKey(input.tipo);
  const disciplineKey = getDisciplineKey(input.componenteCurricular);
  const levelKey = getLevelKey(input.etapa, input.anoSerie);

  return {
    materialKey,
    disciplineKey,
    levelKey,
    material: pedagogicalBrain.materialTypes[materialKey as keyof typeof pedagogicalBrain.materialTypes],
    discipline: disciplineLenses.lenses[disciplineKey as keyof typeof disciplineLenses.lenses],
    progression: gradeProgression.levels[levelKey as keyof typeof gradeProgression.levels],
    questionModels,
    rubrics,
    methodologies,
    qualityRules,
    waitingMessages,
    sourcePolicy,
  };
}

export function buildPlanifyPedagogicalBrainInstruction(input: PlanifyBrainInput): string {
  const contract = getPlanifyPedagogicalContract(input);
  const material = contract.material;
  const discipline = contract.discipline;
  const progression = contract.progression;
  const quantity = input.quantidadeQuestoes ? `Quantidade exigida: ${input.quantidadeQuestoes}.` : "Quantidade: usar a solicitação do professor.";

  return [
    "PLANIFY PEDAGOGICAL BRAIN — CONTRATO DE ENTREGA OFFLINE",
    `Tipo de material: ${input.tipo}. ${quantity}`,
    `Tema: ${input.tema}.`,
    `Etapa/série: ${input.etapa} / ${input.anoSerie}.`,
    `Componente: ${input.componenteCurricular}.`,
    "",
    "FORMA OBRIGATÓRIA DO PRODUTO:",
    `- ${material.delivery}`,
    `- Seções obrigatórias: ${material.requiredSections.join("; ")}.`,
    `- Proibições: ${material.forbidden.join("; ")}.`,
    "",
    "LENTE DA DISCIPLINA:",
    `- Foco: ${discipline.focus.join("; ")}.`,
    `- Evitar: ${discipline.avoid.join("; ")}.`,
    `- Qualidade esperada: ${discipline.quality}.`,
    "",
    "PROGRESSÃO DA ETAPA:",
    `- Linguagem: ${progression.language}.`,
    `- Produtos adequados: ${progression.products.join("; ")}.`,
    `- Evitar: ${progression.avoid.join("; ")}.`,
    "",
    "PORTÕES DE QUALIDADE:",
    ...qualityRules.hardGates.map((gate) => `- ${gate}`),
    "",
    "REGRA FINAL: entregar o material pronto, original, aplicável e com gabarito específico. Não explicar demais antes do produto.",
  ].join("\n");
}

export function getPlanifyWaitingMessage(index = 0): string {
  const messages = waitingMessages.messages;
  return messages[index % messages.length] || "Organizando conhecimento em material aplicável.";
}
