export const PEI_GENERATION_TYPE = "pei";

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
  periodoRealizacao?: string;
  professorRegente?: string;
  professorAee?: string;
  disciplina: string;
  areaConhecimento?: string;
  cid: string;
  conteudos: string[];
  habilidades: string[];
  trimestre: PeiTrimestre;
  necessidades?: string;
  potencialidades?: string;
  barreiras?: string;
  recursos?: string;
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
      "Rotina previsivel com antecipacao de etapas",
      "Instrucao visual e comandos fragmentados",
      "Tempo ampliado para registro e resposta",
      "Mediacao social planejada em atividades coletivas",
    ],
  },
  {
    codigo: "F90.0",
    label: "F90.0 - TDAH",
    categoria: "Atencao e autorregulacao",
    suportes: [
      "Tarefas em blocos curtos com metas visiveis",
      "Pausas breves e combinadas",
      "Checklist de execucao",
      "Assento com menor distracao e retomadas positivas",
    ],
  },
  {
    codigo: "F81.0",
    label: "F81.0 - Transtorno especifico de leitura",
    categoria: "Aprendizagem",
    suportes: [
      "Leitura mediada e textos com marcadores",
      "Fonte ampliada e espacamento adequado",
      "Audio, leitura compartilhada ou pares leitores",
      "Avaliacao oral complementar quando necessario",
    ],
  },
  {
    codigo: "F81.1",
    label: "F81.1 - Transtorno especifico da soletracao/escrita",
    categoria: "Aprendizagem",
    suportes: [
      "Banco de palavras e modelos de resposta",
      "Revisao guiada por criterios",
      "Possibilidade de registro digitado",
      "Valorizacao do conteudo antes da ortografia",
    ],
  },
  {
    codigo: "F81.2",
    label: "F81.2 - Transtorno especifico das habilidades aritmeticas",
    categoria: "Aprendizagem",
    suportes: [
      "Material manipulavel e representacoes visuais",
      "Resolucao passo a passo",
      "Calculadora pedagogica quando pertinente",
      "Problemas contextualizados com linguagem direta",
    ],
  },
  {
    codigo: "F70",
    label: "F70 - Deficiencia intelectual leve",
    categoria: "Deficiencia intelectual",
    suportes: [
      "Objetivos essenciais priorizados",
      "Atividades com menor carga cognitiva por etapa",
      "Repeticao planejada e generalizacao",
      "Avaliacao processual com evidencias variadas",
    ],
  },
  {
    codigo: "F71",
    label: "F71 - Deficiencia intelectual moderada",
    categoria: "Deficiencia intelectual",
    suportes: [
      "Curriculo funcional articulado ao conteudo",
      "Modelagem, pistas graduadas e rotina estruturada",
      "Recursos concretos e comunicacao acessivel",
      "Registros de autonomia, participacao e transferencia",
    ],
  },
  {
    codigo: "H90",
    label: "H90 - Deficiencia auditiva/perda auditiva",
    categoria: "Sensorial",
    suportes: [
      "Apoio visual para instrucoes e conceitos",
      "Posicionamento que favoreca leitura labial/Libras",
      "Legendas, imagens e organizadores graficos",
      "Checagem de compreensao sem exposicao do estudante",
    ],
  },
  {
    codigo: "H54",
    label: "H54 - Deficiencia visual/baixa visao",
    categoria: "Sensorial",
    suportes: [
      "Material ampliado ou recurso digital acessivel",
      "Descricao verbal de imagens, graficos e demonstracoes",
      "Contraste adequado e organizacao espacial",
      "Tempo ampliado para leitura e localizacao",
    ],
  },
  {
    codigo: "G80",
    label: "G80 - Paralisia cerebral",
    categoria: "Motora",
    suportes: [
      "Adequacao motora para registro e manipulacao",
      "Tecnologia assistiva quando disponivel",
      "Tempo ampliado e reducao de copias extensas",
      "Participacao por diferentes formas de resposta",
    ],
  },
  {
    codigo: "F80",
    label: "F80 - Transtornos da fala e linguagem",
    categoria: "Comunicacao",
    suportes: [
      "Comunicacao alternativa ou pistas visuais",
      "Tempo de resposta preservado",
      "Perguntas objetivas e reformulacao de comandos",
      "Valorizacao de respostas multimodais",
    ],
  },
  {
    codigo: "AHSD",
    label: "Altas habilidades/superdotacao - enriquecimento",
    categoria: "Altas habilidades/superdotacao",
    suportes: [
      "Enriquecimento curricular com investigacao autoral",
      "Desafios abertos e produtos criativos",
      "Aprofundamento por projetos",
      "Mentoria, socializacao de descobertas e autonomia",
    ],
  },
  {
    codigo: "Z55",
    label: "Z55 - Necessidade educacional/contexto escolar sem CID definido",
    categoria: "Acompanhamento pedagogico",
    suportes: [
      "Observacao pedagogica sistematica",
      "Adaptacoes flexiveis conforme barreiras identificadas",
      "Registro de progresso por evidencias",
      "Articulacao com familia, AEE e equipe escolar",
    ],
  },
];

export const PEI_DISCIPLINE_OPTIONS: PeiDisciplineOption[] = [
  {
    value: "Lingua Portuguesa",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Leitura e interpretacao de textos",
      "Producao textual",
      "Analise linguistica e semantica",
      "Coesao e coerencia",
      "Classes de palavras",
      "Oralidade e argumentacao",
    ],
    habilidades: [
      { id: "lp-leitura", label: "Localizar informacoes explicitas e inferir sentidos" },
      { id: "lp-producao", label: "Planejar, produzir e revisar textos" },
      { id: "lp-analise", label: "Reconhecer recursos linguisticos em uso" },
      { id: "lp-argumentacao", label: "Organizar argumentos com clareza" },
      { id: "lp-multissemiose", label: "Interpretar textos verbais e multissemiose" },
    ],
  },
  {
    value: "Matematica",
    area: "Matematica e suas Tecnologias",
    conteudos: [
      "Numeros e operacoes",
      "Algebra e padroes",
      "Grandezas e medidas",
      "Geometria",
      "Probabilidade e estatistica",
      "Resolucao de problemas",
    ],
    habilidades: [
      { id: "mat-problemas", label: "Resolver problemas com estrategias variadas" },
      { id: "mat-representar", label: "Representar ideias matematicas por esquemas e linguagem simbolica" },
      { id: "mat-estimar", label: "Estimar, calcular e verificar resultados" },
      { id: "mat-graficos", label: "Ler tabelas, graficos e situacoes-problema" },
      { id: "mat-argumentar", label: "Explicar procedimentos e justificar respostas" },
    ],
  },
  {
    value: "Ciencias",
    area: "Ciencias da Natureza",
    conteudos: [
      "Vida e evolucao",
      "Materia e energia",
      "Terra e universo",
      "Saude e ambiente",
      "Investigacao cientifica",
    ],
    habilidades: [
      { id: "cie-investigar", label: "Observar, comparar e registrar evidencias" },
      { id: "cie-explicar", label: "Explicar fenomenos com linguagem cientifica acessivel" },
      { id: "cie-relacionar", label: "Relacionar conceitos cientificos ao cotidiano" },
      { id: "cie-cuidar", label: "Reconhecer praticas de cuidado com saude e ambiente" },
    ],
  },
  {
    value: "Historia",
    area: "Ciencias Humanas e Sociais Aplicadas",
    conteudos: [
      "Fontes historicas",
      "Tempo, memoria e identidade",
      "Formacao social e cultural",
      "Cidadania e direitos",
      "Processos historicos do Brasil e do mundo",
    ],
    habilidades: [
      { id: "his-fontes", label: "Analisar fontes historicas com mediacao" },
      { id: "his-tempo", label: "Organizar acontecimentos em sequencia temporal" },
      { id: "his-comparar", label: "Comparar modos de vida em tempos e espacos distintos" },
      { id: "his-cidadania", label: "Relacionar direitos, deveres e participacao social" },
    ],
  },
  {
    value: "Geografia",
    area: "Ciencias Humanas e Sociais Aplicadas",
    conteudos: [
      "Lugar, paisagem e territorio",
      "Cartografia",
      "Meio ambiente",
      "Populacao e economia",
      "Escalas local, regional e global",
    ],
    habilidades: [
      { id: "geo-observar", label: "Observar e descrever paisagens e espacos" },
      { id: "geo-mapas", label: "Ler mapas, legendas e representacoes espaciais" },
      { id: "geo-relacoes", label: "Relacionar sociedade, natureza e transformacoes do espaco" },
      { id: "geo-problemas", label: "Identificar problemas ambientais e sociais do territorio" },
    ],
  },
  {
    value: "Lingua Inglesa",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Leitura de textos curtos",
      "Vocabulado tematico",
      "Compreensao oral",
      "Producao de frases e pequenos textos",
      "Interacao em situacoes comunicativas",
    ],
    habilidades: [
      { id: "ing-vocab", label: "Reconhecer vocabulario em contexto" },
      { id: "ing-compreender", label: "Compreender comandos e mensagens simples" },
      { id: "ing-produzir", label: "Produzir frases com apoio de modelo" },
      { id: "ing-interagir", label: "Participar de interacoes orais planejadas" },
    ],
  },
  {
    value: "Arte",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Artes visuais",
      "Musica e ritmo",
      "Teatro e expressao corporal",
      "Processos criativos",
      "Leitura de imagens",
    ],
    habilidades: [
      { id: "art-criar", label: "Experimentar materiais, tecnicas e linguagens artisticas" },
      { id: "art-apreciar", label: "Apreciar producoes artisticas com criterios simples" },
      { id: "art-expressar", label: "Expressar ideias e sentimentos por linguagem artistica" },
      { id: "art-socializar", label: "Compartilhar processos e produtos criativos" },
    ],
  },
  {
    value: "Educacao Fisica",
    area: "Linguagens e suas Tecnologias",
    conteudos: [
      "Jogos e brincadeiras",
      "Esportes",
      "Ginastica e consciencia corporal",
      "Dancas e ritmos",
      "Praticas corporais inclusivas",
    ],
    habilidades: [
      { id: "edf-participar", label: "Participar de praticas corporais com seguranca" },
      { id: "edf-regras", label: "Compreender e respeitar regras combinadas" },
      { id: "edf-cooperar", label: "Cooperar com colegas em jogos e desafios" },
      { id: "edf-autonomia", label: "Reconhecer limites corporais e estrategias de autocuidado" },
    ],
  },
  {
    value: "Biologia",
    area: "Ciencias da Natureza e suas Tecnologias",
    conteudos: [
      "Citologia e organizacao dos seres vivos",
      "Genetica",
      "Ecologia",
      "Evolucao",
      "Saude, corpo humano e qualidade de vida",
    ],
    habilidades: [
      { id: "bio-sistemas", label: "Relacionar estruturas biologicas e funcoes" },
      { id: "bio-evidencias", label: "Interpretar evidencias, esquemas e modelos biologicos" },
      { id: "bio-ambiente", label: "Analisar relacoes entre seres vivos e ambiente" },
      { id: "bio-saude", label: "Aplicar conhecimentos biologicos a situacoes de saude" },
    ],
  },
  {
    value: "Fisica",
    area: "Ciencias da Natureza e suas Tecnologias",
    conteudos: [
      "Movimento e forcas",
      "Energia",
      "Ondas",
      "Eletricidade",
      "Fisica no cotidiano",
    ],
    habilidades: [
      { id: "fis-modelar", label: "Usar modelos simples para explicar fenomenos fisicos" },
      { id: "fis-medir", label: "Interpretar medidas, unidades e grandezas" },
      { id: "fis-resolver", label: "Resolver situacoes-problema com apoio visual" },
      { id: "fis-cotidiano", label: "Relacionar conceitos fisicos a tecnologias e cotidiano" },
    ],
  },
  {
    value: "Quimica",
    area: "Ciencias da Natureza e suas Tecnologias",
    conteudos: [
      "Materia e transformacoes",
      "Substancias e misturas",
      "Ligacoes quimicas",
      "Reacoes quimicas",
      "Quimica ambiental",
    ],
    habilidades: [
      { id: "qui-classificar", label: "Classificar materiais e transformacoes" },
      { id: "qui-representar", label: "Representar fenomenos por esquemas e linguagem quimica" },
      { id: "qui-investigar", label: "Observar evidencias de transformacoes quimicas" },
      { id: "qui-ambiente", label: "Relacionar quimica, tecnologia e ambiente" },
    ],
  },
];

export function getPeiCidOption(codigo: string): PeiCidOption {
  return (
    PEI_CID_OPTIONS.find((option) => option.codigo === codigo) ??
    PEI_CID_OPTIONS[0]
  );
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
