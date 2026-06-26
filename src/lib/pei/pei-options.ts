import type { BnccSelectedSkillPayload } from "@/lib/bncc/bncc-suggestion-ui";

export const PEI_GENERATION_TYPE = "pei";

export type { BnccSelectedSkillPayload };

export type PeiTrimestre = "1" | "2" | "3" | "todos";

export type PeiCidOption = {
  codigo: string;
  label: string;
  categoria: string;
  suportes: string[];
};

export type PeiSkillOption = {
  id: string;
  label: string;
};

export type PeiDisciplineOption = {
  value: string;
  area: string;
  conteudos: string[];
  habilidades: PeiSkillOption[];
};

export type PeiGenerationRequest = {
  estudanteNome?: string;
  dataNascimento?: string;
  etapa: string;
  anoSerie: string;
  turma?: string | null;
  turno?: string;
  professorRegente?: string;
  professorAee?: string;
  disciplina: string;
  areaConhecimento?: string;
  cid?: string;
  cids?: string[];
  conteudos: string[];
  habilidadesSelecionadas: BnccSelectedSkillPayload[];
  trimestre: PeiTrimestre;
  observacoes?: string;
  gerarParecer?: boolean;
  idempotencyKey?: string;
  classId?: string | null;
  className?: string | null;
  discipline?: string | null;
  disciplinaContexto?: string | null;
};

export type PeiGenerationResult = {
  ok: true;
  html: string;
  parecer: string;
  title: string;
  pipeline: "pei-ai" | "pei-fallback";
  qualityScore: number;
  alertas: string[];
  creditCost?: number;
  materialId?: string | null;
};

export const PEI_TRIMESTER_OPTIONS: Array<{
  value: PeiTrimestre;
  label: string;
}> = [
  { value: "1", label: "1º trimestre" },
  { value: "2", label: "2º trimestre" },
  { value: "3", label: "3º trimestre" },
  { value: "todos", label: "Todos os trimestres" },
];

export const PEI_CID_OPTIONS: PeiCidOption[] = [
  {
    codigo: "F84.0",
    label: "F84.0 - Transtorno do Espectro Autista",
    categoria: "Neurodesenvolvimento",
    suportes: [
      "Rotina previsível com antecipação de etapas",
      "Instrução visual e comandos fragmentados",
      "Tempo ampliado para registro e resposta",
      "Mediação social planejada em atividades coletivas",
    ],
  },
  {
    codigo: "F90.0",
    label: "F90.0 - TDAH",
    categoria: "Atenção e autorregulação",
    suportes: [
      "Tarefas em blocos curtos com metas visíveis",
      "Pausas breves e combinadas",
      "Checklist de execução",
      "Assento com menor distração e retomadas positivas",
    ],
  },
  {
    codigo: "F81.0",
    label: "F81.0 - Transtorno específico de leitura",
    categoria: "Aprendizagem",
    suportes: [
      "Leitura mediada e textos com marcadores",
      "Fonte ampliada e espaçamento adequado",
      "Áudio, leitura compartilhada ou pares leitores",
      "Avaliação oral complementar quando necessário",
    ],
  },
  {
    codigo: "F81.1",
    label: "F81.1 - Transtorno específico da soletração/escrita",
    categoria: "Aprendizagem",
    suportes: [
      "Banco de palavras e modelos de resposta",
      "Revisão guiada por critérios",
      "Possibilidade de registro digitado",
      "Valorização do conteúdo antes da ortografia",
    ],
  },
  {
    codigo: "F81.2",
    label: "F81.2 - Transtorno específico das habilidades aritméticas",
    categoria: "Aprendizagem",
    suportes: [
      "Material manipulável e representações visuais",
      "Resolução passo a passo",
      "Calculadora pedagógica quando pertinente",
      "Problemas contextualizados com linguagem direta",
    ],
  },
  {
    codigo: "F70",
    label: "F70 - Deficiência intelectual leve",
    categoria: "Deficiência intelectual",
    suportes: [
      "Objetivos essenciais priorizados",
      "Atividades com menor carga cognitiva por etapa",
      "Repetição planejada e generalização",
      "Avaliação processual com evidências variadas",
    ],
  },
  {
    codigo: "F71",
    label: "F71 - Deficiência intelectual moderada",
    categoria: "Deficiência intelectual",
    suportes: [
      "Currículo funcional articulado ao conteúdo",
      "Modelagem, pistas graduadas e rotina estruturada",
      "Recursos concretos e comunicação acessível",
      "Registros de autonomia, participação e transferência",
    ],
  },
  {
    codigo: "H90",
    label: "H90 - Deficiência auditiva/perda auditiva",
    categoria: "Sensorial",
    suportes: [
      "Apoio visual para instruções e conceitos",
      "Posicionamento que favoreça leitura labial/Libras",
      "Legendas, imagens e organizadores gráficos",
      "Checagem de compreensão sem exposição do estudante",
    ],
  },
  {
    codigo: "H54",
    label: "H54 - Deficiência visual/baixa visão",
    categoria: "Sensorial",
    suportes: [
      "Material ampliado ou recurso digital acessível",
      "Descrição verbal de imagens, gráficos e demonstrações",
      "Contraste adequado e organização espacial",
      "Tempo ampliado para leitura e localização",
    ],
  },
  {
    codigo: "G80",
    label: "G80 - Paralisia cerebral",
    categoria: "Motora",
    suportes: [
      "Adequação motora para registro e manipulação",
      "Tecnologia assistiva quando disponível",
      "Tempo ampliado e redução de cópias extensas",
      "Participação por diferentes formas de resposta",
    ],
  },
  {
    codigo: "F80",
    label: "F80 - Transtornos da fala e linguagem",
    categoria: "Comunicação",
    suportes: [
      "Comunicação alternativa ou pistas visuais",
      "Tempo de resposta preservado",
      "Perguntas objetivas e reformulação de comandos",
      "Valorização de respostas multimodais",
    ],
  },
  {
    codigo: "AHSD",
    label: "Altas habilidades/superdotação - enriquecimento",
    categoria: "Altas habilidades/superdotação",
    suportes: [
      "Enriquecimento curricular com investigação autoral",
      "Desafios abertos e produtos criativos",
      "Aprofundamento por projetos",
      "Mentoria, socialização de descobertas e autonomia",
    ],
  },
  {
    codigo: "Z55",
    label: "Z55 - Necessidade educacional/contexto escolar sem CID definido",
    categoria: "Acompanhamento pedagógico",
    suportes: [
      "Observação pedagógica sistemática",
      "Adaptações flexíveis conforme pontos de acesso curricular identificados",
      "Registro de progresso por evidências",
      "Articulação com família, AEE e equipe escolar",
    ],
  },
];

export const PEI_DISCIPLINE_OPTIONS: PeiDisciplineOption[] = [
  {
    value: "Língua Portuguesa",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Leitura e interpretação de textos",
      "Produção textual",
      "Análise linguística e semântica",
      "Coesão e coerência",
      "Classes de palavras",
      "Oralidade e argumentação",
    ],
    habilidades: [
      { id: "lp-leitura", label: "Localizar informações explícitas e inferir sentidos" },
      { id: "lp-producao", label: "Planejar, produzir e revisar textos" },
      { id: "lp-analise", label: "Reconhecer recursos linguísticos em uso" },
      { id: "lp-argumentacao", label: "Organizar argumentos com clareza" },
      { id: "lp-multissemiose", label: "Interpretar textos verbais e multissemióticos" },
    ],
  },
  {
    value: "Matemática",
    area: "Matemática e suas Tecnologias",
    conteudos: [
      "Números e operações",
      "Álgebra e padrões",
      "Grandezas e medidas",
      "Geometria",
      "Probabilidade e estatística",
      "Resolução de problemas",
    ],
    habilidades: [
      { id: "mat-problemas", label: "Resolver problemas com estratégias variadas" },
      { id: "mat-representar", label: "Representar ideias matemáticas por esquemas e linguagem simbólica" },
      { id: "mat-estimar", label: "Estimar, calcular e verificar resultados" },
      { id: "mat-graficos", label: "Ler tabelas, gráficos e situações-problema" },
      { id: "mat-argumentar", label: "Explicar procedimentos e justificar respostas" },
    ],
  },
  {
    value: "Ciências",
    area: "Ciências da Natureza",
    conteudos: [
      "Vida e evolução",
      "Matéria e energia",
      "Terra e universo",
      "Saúde e ambiente",
      "Investigação científica",
    ],
    habilidades: [
      { id: "cie-investigar", label: "Observar, comparar e registrar evidências" },
      { id: "cie-explicar", label: "Explicar fenômenos com linguagem científica acessível" },
      { id: "cie-relacionar", label: "Relacionar conceitos científicos ao cotidiano" },
      { id: "cie-cuidar", label: "Reconhecer práticas de cuidado com saúde e ambiente" },
    ],
  },
  {
    value: "História",
    area: "Ciências Humanas e Sociais Aplicadas",
    conteudos: [
      "Fontes históricas",
      "Tempo, memória e identidade",
      "Formação social e cultural",
      "Cidadania e direitos",
      "Processos históricos do Brasil e do mundo",
    ],
    habilidades: [
      { id: "his-fontes", label: "Analisar fontes históricas com mediação" },
      { id: "his-tempo", label: "Organizar acontecimentos em sequência temporal" },
      { id: "his-comparar", label: "Comparar modos de vida em tempos e espaços distintos" },
      { id: "his-cidadania", label: "Relacionar direitos, deveres e participação social" },
    ],
  },
  {
    value: "Geografia",
    area: "Ciências Humanas e Sociais Aplicadas",
    conteudos: [
      "Lugar, paisagem e território",
      "Cartografia",
      "Meio ambiente",
      "População e economia",
      "Escalas local, regional e global",
    ],
    habilidades: [
      { id: "geo-observar", label: "Observar e descrever paisagens e espaços" },
      { id: "geo-mapas", label: "Ler mapas, legendas e representações espaciais" },
      { id: "geo-relacoes", label: "Relacionar sociedade, natureza e transformações do espaço" },
      { id: "geo-problemas", label: "Identificar problemas ambientais e sociais do território" },
    ],
  },
  {
    value: "Língua Inglesa",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Leitura de textos curtos",
      "Vocabulário temático",
      "Compreensão oral",
      "Produção de frases e pequenos textos",
      "Interação em situações comunicativas",
    ],
    habilidades: [
      { id: "ing-vocab", label: "Reconhecer vocabulário em contexto" },
      { id: "ing-compreender", label: "Compreender comandos e mensagens simples" },
      { id: "ing-produzir", label: "Produzir frases com apoio de modelo" },
      { id: "ing-interagir", label: "Participar de interações orais planejadas" },
    ],
  },
  {
    value: "Arte",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Artes visuais",
      "Música e ritmo",
      "Teatro e expressão corporal",
      "Processos criativos",
      "Leitura de imagens",
    ],
    habilidades: [
      { id: "art-criar", label: "Experimentar materiais, técnicas e linguagens artísticas" },
      { id: "art-apreciar", label: "Apreciar produções artísticas com critérios simples" },
      { id: "art-expressar", label: "Expressar ideias e sentimentos por linguagem artística" },
      { id: "art-socializar", label: "Compartilhar processos e produtos criativos" },
    ],
  },
  {
    value: "Educação Física",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Jogos e brincadeiras",
      "Esportes",
      "Ginástica e consciência corporal",
      "Danças e ritmos",
      "Práticas corporais inclusivas",
    ],
    habilidades: [
      { id: "edf-participar", label: "Participar de práticas corporais com segurança" },
      { id: "edf-regras", label: "Compreender e respeitar regras combinadas" },
      { id: "edf-cooperar", label: "Cooperar com colegas em jogos e desafios" },
      { id: "edf-autonomia", label: "Reconhecer limites corporais e estratégias de autocuidado" },
    ],
  },
  {
    value: "Biologia",
    area: "Ciências da Natureza e suas Tecnologias",
    conteudos: [
      "Citologia e organização dos seres vivos",
      "Genética",
      "Ecologia",
      "Evolução",
      "Saúde, corpo humano e qualidade de vida",
    ],
    habilidades: [
      { id: "bio-sistemas", label: "Relacionar estruturas biológicas e funções" },
      { id: "bio-evidencias", label: "Interpretar evidências, esquemas e modelos biológicos" },
      { id: "bio-ambiente", label: "Analisar relações entre seres vivos e ambiente" },
      { id: "bio-saude", label: "Aplicar conhecimentos biológicos a situações de saúde" },
    ],
  },
  {
    value: "Física",
    area: "Ciências da Natureza e suas Tecnologias",
    conteudos: [
      "Movimento e forças",
      "Energia",
      "Ondas",
      "Eletricidade",
      "Física no cotidiano",
    ],
    habilidades: [
      { id: "fis-modelar", label: "Usar modelos simples para explicar fenômenos físicos" },
      { id: "fis-medir", label: "Interpretar medidas, unidades e grandezas" },
      { id: "fis-resolver", label: "Resolver situações-problema com apoio visual" },
      { id: "fis-cotidiano", label: "Relacionar conceitos físicos a tecnologias e cotidiano" },
    ],
  },
  {
    value: "Química",
    area: "Ciências da Natureza e suas Tecnologias",
    conteudos: [
      "Matéria e transformações",
      "Substâncias e misturas",
      "Ligações químicas",
      "Reações químicas",
      "Química ambiental",
    ],
    habilidades: [
      { id: "qui-classificar", label: "Classificar materiais e transformações" },
      { id: "qui-representar", label: "Representar fenômenos por esquemas e linguagem química" },
      { id: "qui-investigar", label: "Observar evidências de transformações químicas" },
      { id: "qui-ambiente", label: "Relacionar química, tecnologia e ambiente" },
    ],
  },
];

export function getPeiCidOption(codigo: string): PeiCidOption {
  return (
    PEI_CID_OPTIONS.find((option) => option.codigo === codigo) ??
    PEI_CID_OPTIONS[0]
  );
}

export function getPeiCidOptions(codigos: string[]): PeiCidOption[] {
  const selected = codigos
    .map((codigo) => PEI_CID_OPTIONS.find((option) => option.codigo === codigo))
    .filter((option): option is PeiCidOption => Boolean(option));

  return selected.length ? selected : [PEI_CID_OPTIONS[0]];
}

export function getPeiDisciplineOption(value: string): PeiDisciplineOption {
  return (
    PEI_DISCIPLINE_OPTIONS.find((option) => option.value === value) ??
    PEI_DISCIPLINE_OPTIONS[0]
  );
}

export function getPeiContentOptions(disciplina: string): string[] {
  return [...getPeiDisciplineOption(disciplina).conteudos];
}

export function getPeiSkillOptions(disciplina: string): PeiSkillOption[] {
  return [...getPeiDisciplineOption(disciplina).habilidades];
}
