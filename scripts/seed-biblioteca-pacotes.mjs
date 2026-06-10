/**
 * Seed da Biblioteca Premium (materiais reais em library_materials + Storage).
 * Run: npm run seed:biblioteca-pacotes
 *
 * NOTA: O cache pedagógico (pedagogical_cache_entries / seed:pedagogical-themes)
 * alimenta contexto para geração com IA — NÃO aparece em /biblioteca.
 * Esta seed popula a Biblioteca Premium com arquivos DOCX baixáveis.
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET_NAME = "biblioteca-materiais";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
        } catch {
          // try next
        }
      }
    }
    if (specifier.startsWith(".")) {
      const base = join(dirname(sourcePath), specifier);
      for (const candidate of [base, `${base}.ts`, `${base}.js`]) {
        try {
          return require(candidate);
        } catch {
          // try next
        }
      }
    }
    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, localRequire, module, dirname(sourcePath), sourcePath);
  return module.exports;
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { buildSimpleDocx } = loadTsModule("src/server/docx/simple-docx-builder.ts");

function guessAreaByComponent(componente) {
  const value = componente.toLowerCase();
  if (value.includes("matem")) return "Matemática";
  if (value.includes("ciên") || value.includes("cien")) return "Ciências da Natureza";
  if (value.includes("hist") || value.includes("geo")) return "Ciências Humanas";
  if (value.includes("portugu")) return "Linguagens";
  return "Multicomponente";
}

function seedUuid(slug) {
  const hash = createHash("sha256").update(`planify-biblioteca-seed:${slug}`).digest("hex");
  const variant = ((Number.parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${variant}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
}

function contentHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Pacotes iniciais — conteúdo determinístico, sem chamadas à IA. */
const SEED_PACKAGES = [
  {
    slug: "pacote-lista-fracoes-5ano",
    title: "Lista de exercícios — Frações (5º ano)",
    description:
      "Lista com 10 questões sobre representação, comparação e operações com frações, alinhada ao 5º ano do Ensino Fundamental.",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Frações",
    finalidade: "Prática e avaliação formativa",
    nivelDificuldade: "Intermediário",
    duracao: "50 min",
    habilidadesBncc: ["EF05MA03", "EF05MA04"],
    tags: ["frações", "lista", "5º ano", "matemática"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 5º ano · Matemática",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Instruções",
            content:
              "Resolva as questões no caderno. Mostre os cálculos quando necessário. Tempo sugerido: 50 minutos.",
          },
          {
            title: "Questões",
            items: [
              "1) Represente graficamente as frações 3/4 e 5/8 em retas numéricas ou desenhos de pizza.",
              "2) Compare usando >, < ou =: 2/5 ___ 3/5; 7/10 ___ 4/5.",
              "3) João comeu 2/8 de uma pizza e Maria comeu 3/8. Que fração da pizza foi consumida no total?",
              "4) Simplifique as frações: 12/18; 15/25; 8/12.",
              "5) Converta para fração impropria: 2 inteiros e 1/3.",
              "6) Ana tinha 3/4 de litro de suco e bebeu 1/4. Quanto sobrou?",
              "7) Em uma turma de 24 alunos, 1/3 pratica esporte. Quantos alunos praticam?",
              "8) Ordene em ordem crescente: 1/2, 3/4, 1/4, 5/8.",
              "9) Desafio: Encontre uma fração equivalente a 4/6 com denominador 18.",
              "10) Problema: Um bolo foi dividido em 12 pedaços iguais. Pedro comeu 3 pedaços e Carla comeu 2. Que fração do bolo sobrou?",
            ],
          },
          {
            title: "Gabarito resumido",
            items: [
              "3) 5/8",
              "4) 2/3; 3/5; 2/3",
              "5) 7/3",
              "6) 1/2 litro",
              "7) 8 alunos",
              "8) 1/4 < 5/8 < 1/2 < 3/4",
              "9) 12/18",
              "10) 7/12",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-sistema-solar-5ano",
    title: "Plano de aula — Sistema Solar (5º ano)",
    description:
      "Sequência didática de 50 minutos sobre os componentes do Sistema Solar, com objetivos, recursos e avaliação.",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Ciências",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Sistema Solar",
    finalidade: "Aula expositiva dialogada com atividade prática",
    nivelDificuldade: "Básico",
    duracao: "50 min",
    habilidadesBncc: ["EF05CI10", "EF05CI11"],
    tags: ["sistema solar", "planetas", "5º ano", "ciências"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 5º ano · Ciências",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Objetivos",
            items: [
              "Identificar os componentes do Sistema Solar (Sol, planetas, luas, asteroides).",
              "Comparar tamanhos e distâncias relativas entre corpos celestes.",
              "Relacionar características dos planetas com condições de vida.",
            ],
          },
          {
            title: "Recursos",
            items: [
              "Cartaz ou slides com imagens do Sistema Solar",
              "Bolas de diferentes tamanhos (modelo em escala simplificada)",
              "Ficha de registro em dupla",
            ],
          },
          {
            title: "Desenvolvimento (50 min)",
            items: [
              "10 min — Aquecimento: o que os alunos já sabem sobre o espaço?",
              "15 min — Apresentação dialogada: Sol, planetas rochosos e gasosos.",
              "15 min — Atividade: montar sequência dos planetas e registrar uma curiosidade de cada um.",
              "10 min — Socialização e síntese com mapa mental coletivo.",
            ],
          },
          {
            title: "Avaliação",
            content:
              "Observação da participação e correção da ficha: presença de 8 planetas em ordem e pelo menos duas características corretas (ex.: Marte — vermelho; Júpiter — maior planeta).",
          },
        ],
      };
    },
  },
  {
    slug: "pacote-resumo-revolucao-industrial-9ano",
    title: "Resumo — Revolução Industrial (9º ano)",
    description:
      "Material de apoio com conceitos-chave, linha do tempo e questões de fixação sobre a Revolução Industrial.",
    etapa: "Ensino Fundamental",
    anoSerie: "9º ano",
    componente: "História",
    tipoMaterial: "Material de apoio",
    categoria: "resumo",
    tema: "Revolução Industrial",
    finalidade: "Estudo dirigido e revisão",
    nivelDificuldade: "Intermediário",
    duracao: "40 min",
    habilidadesBncc: ["EF09HI13", "EF09HI14"],
    tags: ["revolução industrial", "resumo", "9º ano", "história"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 9º ano · História",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Conceitos essenciais",
            items: [
              "Revolução Industrial: transição da produção artesanal para a mecanizada, a partir do século XVIII.",
              "Inglaterra como berço: carvão, ferro, revolução agrícola e capital disponível.",
              "Fábrica e máquina a vapor (James Watt) transformam ritmo e escala da produção.",
              "Urbanização acelerada, surgimento do proletariado e novas relações de trabalho.",
            ],
          },
          {
            title: "Linha do tempo simplificada",
            items: [
              "1760–1840 — 1ª Revolução Industrial (têxtil, vapor)",
              "1870–1914 — 2ª Revolução Industrial (aço, eletricidade, petróleo)",
              "Impactos sociais: jornadas longas, trabalho infantil, movimentos operários",
            ],
          },
          {
            title: "Questões de fixação",
            items: [
              "1) Por que a Inglaterra liderou o processo industrial?",
              "2) Cite duas invenções que marcaram a 1ª Revolução Industrial.",
              "3) Quais problemas sociais surgiram com a urbanização?",
              "4) Relacione industrialização e imperialismo no século XIX.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-atividade-interpretacao-texto-6ano",
    title: "Atividade — Interpretação de texto (6º ano)",
    description:
      "Texto narrativo curto com 8 questões de interpretação literal e inferencial para Língua Portuguesa.",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componente: "Língua Portuguesa",
    tipoMaterial: "Atividade",
    categoria: "atividade",
    tema: "Interpretação de texto",
    finalidade: "Prática de leitura e inferência",
    nivelDificuldade: "Intermediário",
    duracao: "45 min",
    habilidadesBncc: ["EF67LP28", "EF67LP29"],
    tags: ["interpretação", "leitura", "6º ano", "português"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 6º ano · Língua Portuguesa",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Texto para leitura",
            content:
              "Lucas acordou cedo para a excursão da escola ao museu de ciências. No ônibus, observava a cidade ainda silenciosa e imaginava os experimentos que veria. Ao chegar, ficou impressionado com o planetário. 'Nunca pensei que o universo fosse tão grande', sussurrou para a colega Ana. No retorno, prometeu a si mesmo ler mais sobre astronomia.",
          },
          {
            title: "Questões",
            items: [
              "1) Para onde a turma foi na excursão?",
              "2) O que mais impressionou Lucas no museu?",
              "3) O que a frase de Lucas revela sobre seu sentimento?",
              "4) Inferência: por que Lucas acordou cedo?",
              "5) Identifique o narrador do texto.",
              "6) Substitua 'impressionado' por um sinônimo.",
              "7) Qual é o tema central do texto?",
              "8) Escreva um final alternativo com 3 linhas.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-lista-equacoes-1-grau-8ano",
    title: "Lista de exercícios — Equações do 1º grau (8º ano)",
    description:
      "Conjunto de 8 equações e problemas contextualizados para consolidar álgebra no 8º ano.",
    etapa: "Ensino Fundamental",
    anoSerie: "8º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Equações do 1º grau",
    finalidade: "Prática algorítmica e modelagem",
    nivelDificuldade: "Intermediário",
    duracao: "50 min",
    habilidadesBncc: ["EF08MA08", "EF08MA09"],
    tags: ["equações", "álgebra", "8º ano", "matemática"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 8º ano · Matemática",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Equações",
            items: [
              "1) Resolva: 3x + 7 = 22",
              "2) Resolva: 5x - 4 = 2x + 11",
              "3) Resolva: 2(x + 3) = 18",
              "4) Resolva: (x/4) + 2 = 7",
            ],
          },
          {
            title: "Problemas",
            items: [
              "5) A soma de três números consecutivos é 48. Qual é o maior deles?",
              "6) Um cinema cobra R$ 20 por ingresso. Com desconto de R$ 5 por estudante, uma turma pagou R$ 180. Quantos estudantes foram?",
              "7) O perímetro de um retângulo é 54 cm. O comprimento é o dobro da largura. Encontre as dimensões.",
              "8) Desafio: a metade de um número somada a 15 resulta em 39. Qual é o número?",
            ],
          },
          {
            title: "Gabarito",
            items: ["1) x=5", "2) x=5", "3) x=6", "4) x=20", "5) 17", "6) 12", "7) 9×18 cm", "8) 48"],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-fotossintese-6ano",
    title: "Plano de aula — Fotossíntese (6º ano)",
    description:
      "Aula investigativa sobre fotossíntese com experimento simples e registro científico.",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componente: "Ciências",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Fotossíntese",
    finalidade: "Compreensão de processos vitais das plantas",
    nivelDificuldade: "Básico",
    duracao: "50 min",
    habilidadesBncc: ["EF06CI04", "EF06CI05"],
    tags: ["fotossíntese", "plantas", "6º ano", "ciências"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 6º ano · Ciências",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Objetivo",
            content:
              "Explicar que a fotossíntese é o processo pelo qual plantas produzem alimento usando luz, água e gás carbônico, liberando oxigênio.",
          },
          {
            title: "Materiais",
            items: ["Folhas de espinafre ou couve", "Água", "Álcool (uso professor)", "Recipiente transparente", "Luz solar ou lâmpada"],
          },
          {
            title: "Roteiro",
            items: [
              "Problematização: de onde vem o alimento das plantas?",
              "Demonstração: teste do amido em folha exposta à luz.",
              "Registro no caderno: reagentes, produtos e importância ecológica.",
              "Debate: conexão com cadeia alimentar e oxigênio atmosférico.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-resumo-brasil-colonia-7ano",
    title: "Resumo — Brasil Colônia (7º ano)",
    description:
      "Síntese dos principais aspectos da colonização portuguesa: economia açucareira, escravidão e administração colonial.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "História",
    tipoMaterial: "Material de apoio",
    categoria: "resumo",
    tema: "Brasil Colônia",
    finalidade: "Revisão para avaliações",
    nivelDificuldade: "Básico",
    duracao: "35 min",
    habilidadesBncc: ["EF07HI01", "EF07HI02"],
    tags: ["brasil colônia", "resumo", "7º ano", "história"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · História",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Chegada e ocupação",
            content:
              "Em 1500, expedição de Cabral chega ao território. Interesse inicial em pau-brasil; posterior fixação com capitanias hereditárias e centralização na Corte (1763, Rio de Janeiro).",
          },
          {
            title: "Economia e sociedade",
            items: [
              "Ciclo do açúcar no Nordeste — engenhos, latifúndio, mão de obra escravizada.",
              "Ciclo do ouro em Minas Gerais — XVIII: urbanização, Corrégimento das Minas, Inconfidência Mineira.",
              "Sociedade estamental: aristocracia rural, clero, comerciantes, escravizados e livres pobres.",
            ],
          },
          {
            title: "Para lembrar",
            items: [
              "Tratado de Tordesilhas (1494) divide mundo entre Portugal e Espanha.",
              "Jesuitas atuam na catequese e educação.",
              "Revolta de Beckman (1684) contra monopólio comercial.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-atividade-proporcionalidade-7ano",
    title: "Atividade — Proporcionalidade (7º ano)",
    description:
      "Situações-problema de proporcionalidade direta e inversa com tabelas e regra de três.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "atividade",
    tema: "Proporcionalidade",
    finalidade: "Aplicação em contextos do cotidiano",
    nivelDificuldade: "Intermediário",
    duracao: "45 min",
    habilidadesBncc: ["EF07MA17", "EF07MA18"],
    tags: ["proporcionalidade", "regra de três", "7º ano"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · Matemática",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Proporcionalidade direta",
            items: [
              "1) Se 4 cadernos custam R$ 28, quanto custam 7 cadernos?",
              "2) Uma receita usa 3 ovos para 12 brigadeiros. Quantos ovos para 36 brigadeiros?",
            ],
          },
          {
            title: "Proporcionalidade inversa",
            items: [
              "3) 4 operários pintam um muro em 9 horas. Em quanto tempo 6 operários pintam o mesmo muro?",
              "4) Um carro a 60 km/h percorre um trecho em 2 h. Quanto tempo a 80 km/h?",
            ],
          },
          {
            title: "Desafio",
            content:
              "Uma mapa na escala 1:50.000 mostra duas cidades a 8 cm de distância. Qual a distância real em km?",
          },
        ],
      };
    },
  },
  {
    slug: "pacote-lista-celula-7ano",
    title: "Lista — Célula e organelas (7º ano)",
    description:
      "Exercícios sobre estrutura celular, funções das organelas e comparação entre célula animal e vegetal.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "Ciências",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Célula",
    finalidade: "Fixação de conceitos de biologia celular",
    nivelDificuldade: "Intermediário",
    duracao: "40 min",
    habilidadesBncc: ["EF07CI07", "EF07CI08"],
    tags: ["célula", "organelas", "7º ano", "ciências"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · Ciências",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Questões objetivas",
            items: [
              "1) Qual organela responsável pela respiração celular?",
              "2) Onde ocorre a fotossíntese?",
              "3) Cite a função do núcleo.",
              "4) Qual estrutura presente na célula vegetal e ausente na animal?",
              "5) O que é membrana plasmática?",
            ],
          },
          {
            title: "Associe coluna",
            content:
              "Mitocôndria — energia | Ribossomos — síntese de proteínas | Vacúolo — armazenamento (vegetal) | Cloroplasto — fotossíntese",
          },
          {
            title: "Desenho",
            content:
              "Esboce e rotule uma célula vegetal indicando pelo menos 5 estruturas estudadas.",
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-democracia-9ano",
    title: "Plano de aula — Democracia e cidadania (9º ano)",
    description:
      "Sequência sobre democracia contemporânea, direitos civis e participação política no Brasil.",
    etapa: "Ensino Fundamental",
    anoSerie: "9º ano",
    componente: "História",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Democracia",
    finalidade: "Formação para cidadania",
    nivelDificuldade: "Intermediário",
    duracao: "50 min",
    habilidadesBncc: ["EF09HI01", "EF09HI02"],
    tags: ["democracia", "cidadania", "9º ano", "história"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 9º ano · História",
        metadata: { Tema: this.tema, BNCC: this.habilidadesBncc.join(", ") },
        sections: [
          {
            title: "Objetivos",
            items: [
              "Diferenciar democracia direta, representativa e participativa.",
              "Relacionar Constituição de 1988 e garantia de direitos fundamentais.",
              "Identificar formas de participação: voto, movimentos sociais, conselhos.",
            ],
          },
          {
            title: "Metodologia",
            items: [
              "Leitura de trecho da Constituição (art. 1º e direitos sociais).",
              "Grupos pesquisam um movimento social brasileiro e apresentam em 3 min.",
              "Rodada de perguntas: como adolescentes podem exercer cidadania?",
            ],
          },
          {
            title: "Avaliação",
            content:
              "Participação nas discussões e síntese escrita (10 linhas) sobre um direito fundamental e sua importância no dia a dia.",
          },
        ],
      };
    },
  },
];

async function findExisting(title, componente) {
  const { data, error } = await supabase
    .from("library_materials")
    .select("id, title, componente, file_path, file_size")
    .eq("title", title)
    .eq("componente", componente)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao consultar material "${title}": ${error.message}`);
  }

  return data;
}

async function seedPackage(pkg) {
  const existing = await findExisting(pkg.title, pkg.componente);
  if (existing) {
    return { status: "skipped", reason: "title+componente" };
  }

  const spec = pkg.buildSpec();
  const buffer = buildSimpleDocx(spec);
  const hash = contentHash(buffer);
  const storagePath = `seed/${pkg.slug}.docx`;
  const fileName = `${pkg.slug}.docx`;
  const id = seedUuid(pkg.slug);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: DOCX_MIME,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload falhou (${pkg.slug}): ${uploadError.message}`);
  }

  const row = {
    id,
    title: pkg.title,
    description: pkg.description,
    etapa: pkg.etapa,
    area_conhecimento: guessAreaByComponent(pkg.componente),
    ano_serie: pkg.anoSerie,
    categoria: pkg.categoria,
    tipo_material: pkg.tipoMaterial,
    componente: pkg.componente,
    tema: pkg.tema,
    finalidade: pkg.finalidade,
    nivel_dificuldade: pkg.nivelDificuldade,
    duracao: pkg.duracao,
    habilidades_bncc: pkg.habilidadesBncc,
    observacoes: `Seed Planify · hash:${hash.slice(0, 12)}`,
    tags: pkg.tags,
    file_name: fileName,
    file_path: storagePath,
    file_mime: DOCX_MIME,
    file_size: buffer.byteLength,
    is_published: true,
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from("library_materials").insert(row);

  if (insertError) {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    throw new Error(`Insert falhou (${pkg.slug}): ${insertError.message}`);
  }

  return { status: "inserted", bytes: buffer.byteLength };
}

async function main() {
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (const pkg of SEED_PACKAGES) {
    try {
      const result = await seedPackage(pkg);
      if (result.status === "skipped") {
        skipped += 1;
        console.log(`  skip: ${pkg.title}`);
      } else {
        inserted += 1;
        console.log(`  ok: ${pkg.title} (${result.bytes} bytes)`);
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ title: pkg.title, message });
      console.warn(`  fail: ${pkg.title} — ${message}`);
    }
  }

  console.log(
    `\nseed:biblioteca-pacotes — ${inserted} inserido(s), ${skipped} ignorado(s), ${failed} falha(s).`,
  );

  if (failures.length > 0) {
    console.log("Falhas:", failures);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
