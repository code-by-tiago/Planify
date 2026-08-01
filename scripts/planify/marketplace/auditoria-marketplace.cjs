const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const report = [];
let failures = 0;
let warnings = 0;

function title(value) {
  report.push("");
  report.push(`## ${value}`);
}

function ok(value) {
  report.push(`[OK] ${value}`);
}

function warn(value) {
  warnings += 1;
  report.push(`[AVISO] ${value}`);
}

function fail(value) {
  failures += 1;
  report.push(`[ERRO] ${value}`);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function listFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        [
          "node_modules",
          ".next",
          ".git",
          ".vercel",
          "out",
          "dist",
          "coverage",
        ].includes(entry.name)
      ) {
        continue;
      }

      listFiles(full, acc);
    } else {
      acc.push(full);
    }
  }

  return acc;
}

function isTextFile(file) {
  return [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".cjs",
    ".mjs",
    ".json",
    ".md",
    ".sql",
    ".css",
  ].includes(path.extname(file).toLowerCase());
}

function relative(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function parseEnvFile(file) {
  const env = {};

  if (!fs.existsSync(file)) {
    return env;
  }

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    env[key] = value;
  }

  return env;
}

function findFilesContaining(patterns, rootDir = "src") {
  const files = listFiles(path.join(root, rootDir)).filter(isTextFile);
  const results = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const matched = patterns.some((pattern) =>
      typeof pattern === "string" ? text.includes(pattern) : pattern.test(text),
    );

    if (matched) {
      results.push([relative(file), text]);
    }
  }

  return results;
}

function checkMarketplaceFiles() {
  title("Arquivos Marketplace");

  const expected = [
    "src/app/marketplace/page.tsx",
  ];

  for (const file of expected) {
    if (exists(file)) {
      ok(`${file} existe.`);
    } else {
      fail(`${file} não encontrado.`);
    }
  }

  const marketplaceFiles = findFilesContaining([
    "Marketplace",
    "marketplace",
    "troca",
    "material compartilhado",
    "compartilhar material",
  ]);

  const uniqueFiles = [...new Set(marketplaceFiles.map(([file]) => file))];

  if (uniqueFiles.length > 0) {
    ok(`Referências Marketplace encontradas em ${uniqueFiles.length} arquivo(s).`);
    for (const file of uniqueFiles.slice(0, 30)) {
      report.push(`   - ${file}`);
    }
  } else {
    fail("Nenhuma referência Marketplace encontrada em src.");
  }
}

function checkPremiumProtection() {
  title("Proteção Premium");

  const guard = read("src/components/PremiumRouteGuard.tsx");

  if (!guard) {
    fail("PremiumRouteGuard.tsx não encontrado.");
    return;
  }

  if (guard.includes("/marketplace")) {
    ok("/marketplace está listado no PremiumRouteGuard.");
  } else {
    fail("/marketplace não está listado no PremiumRouteGuard.");
  }

  const shell = read("src/components/PageShell.tsx");

  if (shell.includes("PremiumRouteGuard")) {
    ok("PageShell usa PremiumRouteGuard.");
  } else {
    fail("PageShell não usa PremiumRouteGuard.");
  }
}

function checkMarketplaceApi() {
  title("API Marketplace");

  const apiFiles = listFiles(path.join(root, "src", "app", "api"))
    .filter(isTextFile)
    .map((file) => [relative(file), fs.readFileSync(file, "utf8")])
    .filter(([file, text]) => file.toLowerCase().includes("marketplace") || /marketplace/i.test(text));

  if (apiFiles.length === 0) {
    warn("Nenhuma API Marketplace encontrada em src/app/api.");
    warn("Se o Marketplace ainda for apenas visual, a próxima etapa deve criar API real com upload/download.");
    return;
  }

  ok(`API Marketplace encontrada em ${apiFiles.length} arquivo(s).`);

  for (const [file, text] of apiFiles) {
    report.push(`   - ${file}`);

    if (text.includes("verifyPremiumAccess") || text.includes("requirePremium") || text.includes("planify_access")) {
      ok(`${file}: parece exigir acesso premium.`);
    } else {
      warn(`${file}: não encontrei validação premium explícita.`);
    }

    if (text.includes("FormData") || text.includes("request.formData")) {
      ok(`${file}: recebe FormData/upload.`);
    }

    if (text.includes("storage") || text.includes("bucket")) {
      ok(`${file}: usa storage/bucket.`);
    }

    if (text.includes("insert") || text.includes("upsert")) {
      ok(`${file}: grava no banco.`);
    }

    if (text.includes("select")) {
      ok(`${file}: lista dados do banco.`);
    }

    if (text.includes("delete")) {
      ok(`${file}: possui remoção/exclusão.`);
    }
  }
}

function checkMarketplaceClient() {
  title("Interface Marketplace");

  const files = findFilesContaining(["Marketplace", "marketplace"], "src/app");

  if (files.length === 0) {
    warn("Não encontrei arquivos de interface Marketplace além da rota esperada.");
    return;
  }

  const joined = files.map(([, text]) => text).join("\n");

  if (/type=["']file["']/.test(joined) || joined.includes("input") && joined.includes("file")) {
    ok("Interface tem campo de arquivo/upload.");
  } else {
    warn("Interface não parece ter upload de arquivo.");
  }

  if (joined.includes("fetch(")) {
    ok("Interface chama API via fetch.");
  } else {
    warn("Interface não parece chamar API. Pode estar estática/mock.");
  }

  if (joined.includes("download") || joined.includes("Baixar") || joined.includes("signedUrl")) {
    ok("Interface tem sinais de download/anexo.");
  } else {
    warn("Interface não parece ter download de anexo.");
  }

  if (joined.includes("useState") || joined.includes("useEffect")) {
    ok("Interface tem estado/client logic.");
  } else {
    warn("Interface pode ser estática demais.");
  }
}

function checkFictitiousContent() {
  title("Conteúdo fictício/mock");

  const files = findFilesContaining(["Marketplace", "marketplace"], "src");
  const suspicious = [];

  const patterns = [
    /mock/i,
    /fake/i,
    /fict/i,
    /exemplo/i,
    /demo/i,
    /placeholder/i,
    /sample/i,
    /material\s+modelo/i,
    /atividade\s+exemplo/i,
  ];

  for (const [file, text] of files) {
    const lines = text.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (patterns.some((pattern) => pattern.test(line))) {
        suspicious.push(`${file}:${index + 1}: ${line.trim().slice(0, 160)}`);
      }
    }
  }

  if (suspicious.length === 0) {
    ok("Não encontrei sinais fortes de conteúdo fictício/mock no Marketplace.");
  } else {
    warn(`Possíveis conteúdos fictícios/mock encontrados (${suspicious.length}).`);
    for (const item of suspicious.slice(0, 30)) {
      report.push(`   - ${item}`);
    }
  }
}

function checkDatabaseScripts() {
  title("Banco de dados / Marketplace");

  const databaseFiles = listFiles(path.join(root, "database")).filter(isTextFile);

  if (databaseFiles.length === 0) {
    warn("Pasta database vazia ou inexistente.");
    return;
  }

  const marketplaceSql = databaseFiles
    .map((file) => [relative(file), fs.readFileSync(file, "utf8")])
    .filter(([, text]) => /marketplace/i.test(text));

  if (marketplaceSql.length === 0) {
    warn("Nenhum SQL Marketplace encontrado em database.");
    warn("A próxima etapa provavelmente precisará criar tabela e bucket para Marketplace.");
    return;
  }

  ok(`SQL Marketplace encontrado em ${marketplaceSql.length} arquivo(s).`);

  for (const [file, text] of marketplaceSql) {
    report.push(`   - ${file}`);

    if (text.includes("create table")) {
      ok(`${file}: cria tabela.`);
    }

    if (text.includes("enable row level security")) {
      ok(`${file}: ativa RLS.`);
    }

    if (text.includes("storage.buckets")) {
      ok(`${file}: cria/configura bucket.`);
    }

    if (text.includes("user_id") || text.includes("created_by")) {
      ok(`${file}: relaciona material com usuário/professor.`);
    }

    if (text.includes("is_published") || text.includes("status")) {
      ok(`${file}: possui status/publicação.`);
    }
  }
}

async function checkSupabaseProbe() {
  title("Supabase Probe Marketplace");

  const env = {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    warn("Sem Supabase URL/service role para probe real.");
    return;
  }

  let createClient;

  try {
    ({ createClient } = require("@supabase/supabase-js"));
  } catch {
    warn("@supabase/supabase-js não disponível para probe real.");
    return;
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const candidateTables = [
    "marketplace_materials",
    "marketplace_items",
    "marketplace_posts",
    "teacher_materials",
    "shared_materials",
  ];

  let foundTable = false;

  for (const table of candidateTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select("*", { count: "exact" })
      .limit(1);

    if (!error) {
      foundTable = true;
      ok(`Tabela encontrada/acessível: ${table}. Registros aproximados: ${count ?? data?.length ?? 0}`);
    }
  }

  if (!foundTable) {
    warn("Nenhuma tabela Marketplace conhecida foi encontrada/acessada no Supabase.");
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      warn(`Não foi possível listar buckets: ${error.message}`);
      return;
    }

    const marketplaceBuckets = (buckets || []).filter((bucket) =>
      /marketplace|materiais-professores|teacher|shared/i.test(bucket.name),
    );

    if (marketplaceBuckets.length > 0) {
      ok(`Bucket(s) Marketplace encontrados: ${marketplaceBuckets.map((bucket) => bucket.name).join(", ")}`);
    } else {
      warn("Nenhum bucket com nome de Marketplace encontrado.");
    }
  } catch (error) {
    warn(`Erro ao listar buckets: ${error.message || error}`);
  }
}

function writeReport() {
  const outDir = path.join(root, "docs", "auditorias");
  fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `auditoria-marketplace-${stamp}.md`);

  const header = [
    "# Planify — Auditoria Marketplace",
    "",
    `Data: ${new Date().toLocaleString("pt-BR")}`,
    "",
    "## Resultado geral",
    "",
    failures > 0
      ? `[ERRO] ${failures} falha(s) encontrada(s).`
      : warnings > 0
        ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s) para revisar.`
        : "[OK] Marketplace sem falhas ou avisos relevantes.",
    "",
  ];

  fs.writeFileSync(outFile, [...header, ...report, ""].join("\n"), "utf8");

  console.log("");
  console.log("===============================================");
  console.log("Planify | Auditoria Marketplace");
  console.log("===============================================");
  console.log("");
  console.log(
    failures > 0
      ? `Resultado: FALHAS (${failures}) E AVISOS (${warnings})`
      : warnings > 0
        ? `Resultado: OK COM AVISOS (${warnings})`
        : "Resultado: OK"
  );
  console.log("");
  console.log(`Relatório salvo em: ${outFile}`);
  console.log("");

  if (failures > 0) {
    process.exitCode = 1;
  }
}

async function main() {
  checkMarketplaceFiles();
  checkPremiumProtection();
  checkMarketplaceApi();
  checkMarketplaceClient();
  checkFictitiousContent();
  checkDatabaseScripts();
  await checkSupabaseProbe();
  writeReport();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
