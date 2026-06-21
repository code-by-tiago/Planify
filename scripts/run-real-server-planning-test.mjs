/**
 * Teste real no servidor: gerar-ia + docx-pacote -> tmp/planning-real-server-test/
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = process.env.PLANIFY_REPRO_BASE_URL || "http://localhost:3001";
const OUT_DIR = path.join(root, "tmp", "planning-real-server-test");

const CONTEUDOS = [
  "Leitura e interpretação de textos narrativos",
  "Produção textual: crônica e relato",
  "Gramática: regência verbal e nominal",
  "Literatura brasileira: modernismo",
  "Oralidade: debates e apresentações",
  "Gêneros digitais e multimodalidade",
  "Argumentação e artigo de opinião",
  "Projeto de pesquisa e revisão bibliográfica",
  "Redação dissertativa-argumentativa",
  "Variação linguística e norma culta",
  "Literatura contemporânea brasileira",
  "Revisão integrada e avaliação formativa",
];

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier.startsWith(".")) {
      const resolved = path.join(path.dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts") && fs.existsSync(candidate)) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        const full = path.join(root, candidate);
        if (fs.existsSync(full)) return loadTsModule(candidate.replace(/\\/g, "/"));
      }
    }
    return require(specifier);
  };
  const evaluator = new Function("exports", "require", "module", "__dirname", "__filename", transpiled);
  evaluator(module.exports, localRequire, module, path.dirname(sourcePath), sourcePath);
  return module.exports;
}

function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  const total = buf.readUInt16LE(eocd + 10);
  let pointer = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < total; i += 1) {
    const compression = buf.readUInt16LE(pointer + 10);
    const size = buf.readUInt32LE(pointer + 20);
    const nameLen = buf.readUInt16LE(pointer + 28);
    const extraLen = buf.readUInt16LE(pointer + 30);
    const commentLen = buf.readUInt16LE(pointer + 32);
    const local = buf.readUInt32LE(pointer + 42);
    const name = buf.subarray(pointer + 46, pointer + 46 + nameLen).toString("utf8");
    const localNameLen = buf.readUInt16LE(local + 26);
    const localExtraLen = buf.readUInt16LE(local + 28);
    const dataStart = local + 30 + localNameLen + localExtraLen;
    const compressed = buf.subarray(dataStart, dataStart + size);
    const data = compression === 8 ? zlib.inflateRawSync(compressed) : Buffer.from(compressed);
    entries.set(name, data);
    pointer += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function buildPayload() {
  return {
    tipoPlanejamento: "anual",
    escola: "EE Teste Servidor Planify",
    professor: "Prof. Teste Real",
    etapa: "Ensino Médio",
    anoSerie: "3ª série",
    turma: "3ª série A",
    areaConhecimento: "Linguagens e suas Tecnologias",
    componenteCurricular: "Língua Portuguesa",
    cargaHoraria: "160 períodos",
    objetivosGerais: "Desenvolver competências de leitura, escrita e análise textual alinhadas à BNCC.",
    observacoes: "Teste real servidor — LP 3ª série, 160 períodos.",
    conteudos: CONTEUDOS.join("\n"),
    habilidadesSelecionadas: [
      { codigo: "EM13LP01", descricao: "Relacionar o texto com condições de produção.", conteudo: CONTEUDOS[0] },
      { codigo: "EM13LP03", descricao: "Analisar intertextualidade.", conteudo: CONTEUDOS[1] },
      { codigo: "EM13LP05", descricao: "Planejar e produzir textos.", conteudo: CONTEUDOS[2] },
      { codigo: "EM13LP10", descricao: "Analisar literatura brasileira.", conteudo: CONTEUDOS[3] },
      { codigo: "EM13LP15", descricao: "Argumentar com fontes confiáveis.", conteudo: CONTEUDOS[6] },
      { codigo: "EM13LP20", descricao: "Compartilhar produções colaborativas.", conteudo: CONTEUDOS[4] },
    ],
    modoMatrizBncc: true,
    trimestresNoPacote: [1],
    idempotencyKey: `real-server-test-${Date.now()}`,
  };
}

async function createTestUserAndToken(env) {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `real-server-${Date.now()}@planify.local`;
  const password = `Real${Date.now().toString(36)}!Aa1`;
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { realServerTest: true },
  });
  if (createError || !created.user?.id) throw new Error(createError?.message || "createUser failed");
  await admin.from("profiles").upsert({ id: created.user.id, email, role: "teacher", is_admin: true, plan: "pro" });
  const signInResponse = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const signInData = await signInResponse.json().catch(() => null);
  if (!signInResponse.ok || !signInData?.access_token) {
    throw new Error(signInData?.error_description || "signIn failed");
  }
  return { token: signInData.access_token, userId: created.user.id, admin };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const env = loadEnv();
  const hasGemini = Boolean(env.GEMINI_API_KEY);
  console.log("=== Teste real servidor Planify ===");
  console.log("BASE_URL:", BASE_URL);
  console.log("GEMINI_API_KEY:", hasGemini ? "presente (modoMatrizBncc evita IA)" : "ausente");
  console.log("OUT_DIR:", OUT_DIR);

  const health = await fetch(`${BASE_URL}/planejamentos`).catch(() => null);
  if (!health?.ok) throw new Error(`Servidor indisponível em ${BASE_URL}`);

  const { buildTrimestralPlansFromAnnual } = loadTsModule("src/lib/planejamentos/planning-trimestral-from-annual.ts");
  const { token, userId, admin } = await createTestUserAndToken(env);
  const payload = buildPayload();

  const t0 = Date.now();
  const genRes = await fetch(`${BASE_URL}/api/planejamentos/gerar-ia`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const genData = await genRes.json().catch(() => null);
  const genMs = Date.now() - t0;

  fs.writeFileSync(path.join(OUT_DIR, "gerar-ia-response.json"), JSON.stringify({ status: genRes.status, elapsedMs: genMs, body: genData }, null, 2));

  if (!genRes.ok || !genData?.success || !genData?.planejamento) {
    throw new Error(genData?.error?.message || genData?.message || `gerar-ia HTTP ${genRes.status}`);
  }

  console.log("gerar-ia OK:", { status: genRes.status, usedAI: genData.usedAI, pipeline: genData.usedAI ? "planning-ai" : "planning-fallback/BNCC", elapsedMs: genMs });

  const planning = genData.planejamento;
  const trimestres = [1];
  const trimestralPlans = buildTrimestralPlansFromAnnual(planning, trimestres);
  const matrizesTrimestrais = {};
  for (const t of trimestres) {
    if (trimestralPlans[t]) matrizesTrimestrais[String(t)] = trimestralPlans[t];
  }

  const docxPayload = {
    tipoPlanejamento: "anual",
    escola: payload.escola,
    professor: payload.professor,
    etapa: payload.etapa,
    anoSerie: payload.anoSerie,
    turma: payload.turma,
    areaConhecimento: payload.areaConhecimento,
    componenteCurricular: payload.componenteCurricular,
    cargaHoraria: payload.cargaHoraria,
    objetivosGerais: payload.objetivosGerais,
    observacoes: payload.observacoes,
    matrizPlanejamento: planning,
    matrizesTrimestrais,
    trimestresExtraidos: trimestres,
  };

  const t1 = Date.now();
  const zipRes = await fetch(`${BASE_URL}/api/planejamentos/docx-pacote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(docxPayload),
  });
  const zipMs = Date.now() - t1;

  if (!zipRes.ok) {
    const errText = await zipRes.text();
    fs.writeFileSync(path.join(OUT_DIR, "docx-pacote-error.txt"), errText);
    throw new Error(`docx-pacote HTTP ${zipRes.status}: ${errText.slice(0, 500)}`);
  }

  const zipBuf = Buffer.from(await zipRes.arrayBuffer());
  const zipPath = path.join(OUT_DIR, "pacote-anual-trimestral-1-lingua-portuguesa-3-serie-160.zip");
  fs.writeFileSync(zipPath, zipBuf);
  console.log("docx-pacote OK:", { status: zipRes.status, zipBytes: zipBuf.length, elapsedMs: zipMs });

  const entries = readZip(zipBuf);
  const extracted = [];
  for (const [name, data] of entries) {
    const safeName = name.replace(/[\\/]/g, "_");
    const outPath = path.join(OUT_DIR, safeName);
    fs.writeFileSync(outPath, data);
    extracted.push(outPath);
    console.log("  extraído:", outPath);
  }

  const trimPlan = trimestralPlans[1];
  const weeksCheck = { semanas2a5: [] };
  if (trimPlan?.conteudos?.length) {
    for (const item of trimPlan.conteudos.slice(0, 8)) {
      weeksCheck.semanas2a5.push({
        numeroAula: item.numeroAula,
        conteudo: (item.conteudo || "").slice(0, 60),
        periodos: item.periodos,
        etapasLen: (item.etapas || "").length,
        metodologiaLen: (item.metodologia || "").length,
        hasPlaceholder: /\[descreva/i.test(JSON.stringify(item)),
      });
    }
  }

  const annualT1 = (planning.conteudos || []).filter((i) => Number(i.trimestre) === 1);
  weeksCheck.annualT1Count = annualT1.length;
  weeksCheck.trimT1Count = trimPlan?.conteudos?.length ?? 0;
  weeksCheck.annualT1Conteudos = annualT1.slice(0, 4).map((i) => (i.conteudo || "").slice(0, 50));
  weeksCheck.trimT1Conteudos = (trimPlan?.conteudos || []).slice(0, 4).map((i) => (i.conteudo || "").slice(0, 50));

  fs.writeFileSync(path.join(OUT_DIR, "verification-weeks.json"), JSON.stringify(weeksCheck, null, 2));

  const summary = {
    server: BASE_URL,
    modoMatrizBncc: true,
    usedAI: genData.usedAI,
    cargaHoraria: payload.cargaHoraria,
    files: [zipPath, ...extracted],
    verification: weeksCheck,
  };
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  await admin.auth.admin.deleteUser(userId);
  console.log("SUMMARY_JSON:", JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
