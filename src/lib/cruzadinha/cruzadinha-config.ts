export const CRUZADINHA_GENERATION_TYPE = "cruzadinha";

export const CRUZADINHA_DIFFICULTY_OPTIONS = [
  { id: "facil", label: "Fácil" },
  { id: "media", label: "Média" },
  { id: "avancada", label: "Avançada" },
] as const;

export type CruzadinhaDifficulty =
  (typeof CRUZADINHA_DIFFICULTY_OPTIONS)[number]["id"];
