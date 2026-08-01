import type { BNCCSkill } from "@/types/bncc";
import { readBNCCSkills } from "../bncc/bncc-service";

export type BnccChallengeQuestion = {
  id: string;
  skillCode: string;
  subject: string | null;
  grade: string | null;
  prompt: string;
  options: string[];
  correctIndex: number;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function truncateDescription(value: string, max = 160): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function buildQuestion(skill: BNCCSkill, distractors: BNCCSkill[], index: number): BnccChallengeQuestion {
  const correct = truncateDescription(skill.descricao);
  const wrongOptions = shuffle(
    distractors
      .filter((candidate) => candidate.codigo !== skill.codigo)
      .map((candidate) => truncateDescription(candidate.descricao)),
  ).slice(0, 2);

  const options = shuffle([correct, ...wrongOptions]);
  const correctIndex = options.indexOf(correct);

  const subject = skill.componente || null;
  const grade = skill.ano || skill.serie || null;
  const contextParts = [subject, grade].filter(Boolean).join(" · ");

  return {
    id: `bncc-${skill.codigo}-${index}`,
    skillCode: skill.codigo,
    subject,
    grade,
    prompt: contextParts
      ? `Qual descrição corresponde à habilidade ${skill.codigo} (${contextParts})?`
      : `Qual descrição corresponde à habilidade ${skill.codigo}?`,
    options,
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
  };
}

export async function getBnccChallengeQuestions(params?: {
  subject?: string | null;
  count?: number;
}): Promise<{ questions: BnccChallengeQuestion[]; totalSkillsAvailable: number }> {
  const count = Math.min(Math.max(params?.count || 3, 1), 5);
  const subject = String(params?.subject || "").trim() || null;

  let skills = await readBNCCSkills(subject ? { subject } : undefined);

  if (skills.length < count + 2 && subject) {
    skills = await readBNCCSkills();
  }

  const totalSkillsAvailable = skills.length;
  if (skills.length < 3) {
    throw new Error(
      "Catálogo BNCC indisponível no momento. Tente novamente após a sincronização das habilidades.",
    );
  }

  const selected = shuffle(skills).slice(0, count);
  const pool = shuffle(skills);

  const questions = selected.map((skill, index) =>
    buildQuestion(skill, pool.filter((candidate) => candidate.codigo !== skill.codigo), index),
  );

  return { questions, totalSkillsAvailable };
}
