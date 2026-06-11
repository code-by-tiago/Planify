/**
 * Fila curada de temas BNCC — rotação automática do pipeline IA.
 * Consumido por scripts/ai-question-bank-pipeline-auto.mjs
 */
export const AI_TOPIC_QUEUE = [
  { topic: "Frações", componente: "Matemática", anoSerie: "5º ano" },
  { topic: "Números decimais", componente: "Matemática", anoSerie: "6º ano" },
  { topic: "Equações do 1º grau", componente: "Matemática", anoSerie: "7º ano" },
  { topic: "Geometria — área e perímetro", componente: "Matemática", anoSerie: "6º ano" },
  { topic: "Porcentagem", componente: "Matemática", anoSerie: "8º ano" },
  { topic: "Funções da linguagem", componente: "Língua Portuguesa", anoSerie: "9º ano" },
  { topic: "Interpretação de texto", componente: "Língua Portuguesa", anoSerie: "6º ano" },
  { topic: "Concordância verbal", componente: "Língua Portuguesa", anoSerie: "7º ano" },
  { topic: "Brasil colonial", componente: "História", anoSerie: "7º ano" },
  { topic: "Revolução Industrial", componente: "História", anoSerie: "9º ano" },
  { topic: "Segunda Guerra Mundial", componente: "História", anoSerie: "9º ano" },
  { topic: "Fotossíntese", componente: "Ciências", anoSerie: "6º ano" },
  { topic: "Sistema Solar", componente: "Ciências", anoSerie: "5º ano" },
  { topic: "Cadeia alimentar", componente: "Ciências", anoSerie: "7º ano" },
  { topic: "Estados físicos da matéria", componente: "Ciências", anoSerie: "8º ano" },
  { topic: "Clima e vegetação", componente: "Geografia", anoSerie: "6º ano" },
  { topic: "Urbanização", componente: "Geografia", anoSerie: "8º ano" },
  { topic: "Tabela periódica", componente: "Química", anoSerie: "9º ano" },
  { topic: "Leis de Newton", componente: "Física", anoSerie: "9º ano" },
  { topic: "Célula e organelas", componente: "Biologia", anoSerie: "8º ano" },
  { topic: "Operações com frações", componente: "Matemática", anoSerie: "6º ano" },
  { topic: "Razão e proporção", componente: "Matemática", anoSerie: "7º ano" },
  { topic: "Volume de sólidos", componente: "Matemática", anoSerie: "8º ano" },
  { topic: "Probabilidade básica", componente: "Matemática", anoSerie: "9º ano" },
  { topic: "Ortografia e acentuação", componente: "Língua Portuguesa", anoSerie: "5º ano" },
  { topic: "Figuras de linguagem", componente: "Língua Portuguesa", anoSerie: "8º ano" },
  { topic: "Gêneros textuais", componente: "Língua Portuguesa", anoSerie: "6º ano" },
  { topic: "Independência do Brasil", componente: "História", anoSerie: "8º ano" },
  { topic: "Escravidão no Brasil", componente: "História", anoSerie: "8º ano" },
  { topic: "Guerra Fria", componente: "História", anoSerie: "9º ano" },
  { topic: "Energia e transformações", componente: "Ciências", anoSerie: "7º ano" },
  { topic: "Corpo humano e saúde", componente: "Ciências", anoSerie: "5º ano" },
  { topic: "Relevo brasileiro", componente: "Geografia", anoSerie: "7º ano" },
  { topic: "Globalização", componente: "Geografia", anoSerie: "9º ano" },
  { topic: "Reações químicas", componente: "Química", anoSerie: "9º ano" },
  { topic: "Eletricidade básica", componente: "Física", anoSerie: "8º ano" },
  { topic: "Ecossistemas", componente: "Biologia", anoSerie: "7º ano" },
  { topic: "Democracia e cidadania", componente: "História", anoSerie: "6º ano" },
  { topic: "Movimentos sociais no Brasil", componente: "História", anoSerie: "9º ano" },
];

/**
 * Seleciona fatia da fila para esta execução (rotação determinística).
 * @param {number} topicsPerRun
 * @param {number} [seed] — default: dia do ano + bloco de 6h UTC (permite 2–4 runs/dia sem repetir offset)
 */
export function pickTopicsForRun(topicsPerRun, seed) {
  const queue = AI_TOPIC_QUEUE;
  if (!queue.length) return [];

  const now = new Date();
  const dayOfYear = Math.floor(
    (Date.now() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86_400_000,
  );
  const sixHourBlock = Math.floor(now.getUTCHours() / 6);
  const daySeed = seed ?? dayOfYear * 4 + sixHourBlock;

  const start = daySeed % queue.length;
  const picked = [];
  for (let i = 0; i < topicsPerRun; i++) {
    picked.push(queue[(start + i) % queue.length]);
  }
  return picked;
}
