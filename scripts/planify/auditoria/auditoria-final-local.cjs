const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const requiredFiles = [
  "package.json",
  ".env.local",
  "src/components/PageShell.tsx",
  "src/components/PremiumRouteGuard.tsx",
  "src/app/login/LoginPageClient.tsx",
  "src/app/api/access/status/route.ts",
  "src/app/api/owner/session/route.ts",
  "src/app/api/admin/session/route.ts",
  "src/app/api/admin/status/route.ts",
  "src/app/api/admin/biblioteca/materiais/route.ts",
  "src/app/api/biblioteca/materiais/route.ts",
  "src/app/admin/page.tsx",
  "src/app/admin/biblioteca/page.tsx",
  "src/app/admin/biblioteca/AdminBibliotecaClient.tsx",
  "src/app/biblioteca/BibliotecaClient.tsx",
  "src/app/planejamentos/page.tsx",
  "src/app/materiais/page.tsx",
  "src/app/editor/page.tsx",
  "src/app/marketplace/page.tsx",
  "src/lib/auth/session-client.ts",
  "src/server/auth/admin-access.ts",
  "src/server/auth/premium-access-service.ts",
];

const optionalButExpectedFiles = [
  "database/09-15-14-biblioteca-admin-simples-definitiva.sql",
  "database/09-10-stripe-webhook-subscriptions.sql",
  "database/09-premium-access-safe.sql",
  "database/09-user-history-safe.sql",
];

const envKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PLANIFY_ADMIN_EMAIL",
  "NEXT_PUBLIC_ADMIN_EMAIL",
];

const stripeEnvPatterns = [
  "STRIPE_PRICE",
  "PRICE_ID",
  "NEXT_PUBLIC_STRIPE",
  "PROFESSOR",
  "PLANO",
];

const protectedRoutes = [
  "/dashboard",
  "/planejamentos",
  "/materiais",
  "/editor",
  "/historico",
  "/biblioteca",
  "/marketplace",
];

const report = [];
let hasFailure = false;
let hasWarning = false;

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
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

function pass(message) {
  report.push(`[OK] ${message}`);
}

function warn(message) {
  hasWarning = true;
  report.push(`[AVISO] ${message}`);
}

function fail(message) {
  hasFailure = true;
  report.push(`[ERRO] ${message}`);
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
          "dist",
          "coverage",
          ".vercel",
          "out",
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
    ".json",
    ".md",
    ".css",
    ".html",
    ".sql",
    ".cjs",
    ".mjs",
    ".ps1",
  ].includes(path.extname(file).toLowerCase());
}

function title(text) {
  report.push("");
  report.push(`## ${text}`);
}

function checkFiles() {
  title("Arquivos essenciais");

  for (const file of requiredFiles) {
    if (exists(file)) {
      pass(file);
    } else {
      fail(`Arquivo ausente: ${file}`);
    }
  }

  title("Arquivos opcionais esperados");

  for (const file of optionalButExpectedFiles) {
    if (exists(file)) {
      pass(file);
    } else {
      warn(`Arquivo opcional não encontrado: ${file}`);
    }
  }
}

function checkEnv() {
  title(".env.local");

  const env = read(".env.local");

  if (!env) {
    fail(".env.local não encontrado ou vazio.");
    return;
  }

  for (const key of envKeys) {
    const pattern = new RegExp(`^${key}=.+`, "m");

    if (pattern.test(env)) {
      pass(`${key} configurado`);
    } else {
      warn(`${key} ausente ou vazio`);
    }
  }

  const hasStripePlan = stripeEnvPatterns.some((key) => env.includes(key));

  if (hasStripePlan) {
    pass("Há variáveis relacionadas a planos/Stripe no .env.local");
  } else {
    warn("Não encontrei variáveis de preço/plano Stripe no .env.local por padrão de nome.");
  }
}

function checkPremiumGuard() {
  title("Proteção Premium");

  const guard = read("src/components/PremiumRouteGuard.tsx");
  const shell = read("src/components/PageShell.tsx");
  const accessRoute = read("src/app/api/access/status/route.ts");

  if (!guard) {
    fail("PremiumRouteGuard.tsx ausente.");
    return;
  }

  if (shell.includes("PremiumRouteGuard")) {
    pass("PageShell usa PremiumRouteGuard.");
  } else {
    fail("PageShell não usa PremiumRouteGuard.");
  }

  for (const route of protectedRoutes) {
    if (guard.includes(route)) {
      pass(`Rota protegida listada: ${route}`);
    } else {
      warn(`Rota não encontrada no PremiumRouteGuard: ${route}`);
    }
  }

  if (accessRoute.includes("verifyPremiumAccess") && accessRoute.includes("planify_owner_access")) {
    pass("/api/access/status valida premium e proprietário.");
  } else if (accessRoute.includes("verifyPremiumAccess")) {
    warn("/api/access/status valida premium, mas não encontrei owner access.");
  } else {
    fail("/api/access/status não parece validar premium corretamente.");
  }
}

function checkAdmin() {
  title("Admin e proprietário");

  const adminAccess = read("src/server/auth/admin-access.ts");
  const adminSession = read("src/app/api/admin/session/route.ts");
  const ownerSession = read("src/app/api/owner/session/route.ts");

  if (adminAccess.includes("PLANIFY_ADMIN_EMAIL") && adminAccess.includes("planify_admin_access")) {
    pass("Admin valida PLANIFY_ADMIN_EMAIL e cookie admin.");
  } else {
    warn("Admin access não parece conter toda validação esperada.");
  }

  if (adminSession.includes("httpOnly") && adminSession.includes("planify_admin_access")) {
    pass("Sessão Admin usa cookie httpOnly.");
  } else {
    warn("Sessão Admin pode não estar usando cookie httpOnly.");
  }

  if (ownerSession.includes("planify_owner_access") && ownerSession.includes("PLANIFY_ADMIN_EMAIL")) {
    pass("Sessão de proprietário configurada.");
  } else {
    warn("Sessão de proprietário não parece completa.");
  }
}

function checkBiblioteca() {
  title("Biblioteca Admin + Usuário");

  const adminApi = read("src/app/api/admin/biblioteca/materiais/route.ts");
  const publicApi = read("src/app/api/biblioteca/materiais/route.ts");
  const adminClient = read("src/app/admin/biblioteca/AdminBibliotecaClient.tsx");
  const userClient = read("src/app/biblioteca/BibliotecaClient.tsx");

  if (adminApi.includes("library_materials") && adminApi.includes("biblioteca-materiais")) {
    pass("API Admin salva em library_materials e bucket biblioteca-materiais.");
  } else {
    fail("API Admin da Biblioteca não parece salvar na tabela/bucket corretos.");
  }

  if (adminApi.includes("requireAdminApi")) {
    pass("API Admin da Biblioteca exige admin.");
  } else {
    fail("API Admin da Biblioteca não parece exigir admin.");
  }

  if (publicApi.includes("library_materials") && publicApi.includes("is_published")) {
    pass("API pública da Biblioteca lê materiais publicados do Admin.");
  } else {
    fail("API pública da Biblioteca não parece ler materiais publicados.");
  }

  if (userClient.includes("/api/biblioteca/materiais")) {
    pass("Biblioteca do usuário chama a API de materiais reais.");
  } else {
    fail("Biblioteca do usuário não chama /api/biblioteca/materiais.");
  }

  if (adminClient.includes("Cadastrar material") && adminClient.includes("file")) {
    pass("Biblioteca Admin tem formulário simples com upload.");
  } else {
    warn("Biblioteca Admin não parece ter formulário de upload esperado.");
  }
}

function checkDocxModels() {
  title("Planejamentos e modelos DOCX");

  const dataDir = path.join(root, "data");
  const dataFiles = listFiles(dataDir).map(rel);
  const docxFiles = dataFiles.filter((file) => file.toLowerCase().endsWith(".docx"));

  if (docxFiles.length > 0) {
    pass(`Modelos DOCX encontrados em data: ${docxFiles.join(", ")}`);
  } else {
    warn("Nenhum .docx encontrado na pasta data.");
  }

  const allTextFiles = listFiles(path.join(root, "src"))
    .filter(isTextFile)
    .map((file) => [rel(file), fs.readFileSync(file, "utf8")]);

  const officialDocxRefs = allTextFiles.filter(([, text]) =>
    text.includes("modelo-anual") ||
    text.includes("modelo-trimestral") ||
    text.includes("official-planning") ||
    text.includes("docx") ||
    text.includes("DOCX")
  );

  if (officialDocxRefs.length > 0) {
    pass(`Referências a DOCX encontradas em ${officialDocxRefs.length} arquivo(s).`);
  } else {
    warn("Não encontrei referências a DOCX no código fonte.");
  }
}

function checkStripe() {
  title("Stripe e assinaturas");

  const files = listFiles(path.join(root, "src"))
    .filter(isTextFile)
    .map((file) => [rel(file), fs.readFileSync(file, "utf8")]);

  const stripeFiles = files.filter(([, text]) =>
    text.includes("stripe") ||
    text.includes("Stripe") ||
    text.includes("subscriptions") ||
    text.includes("checkout")
  );

  if (stripeFiles.length > 0) {
    pass(`Referências Stripe/subscriptions encontradas em ${stripeFiles.length} arquivo(s).`);
  } else {
    warn("Não encontrei referências Stripe/subscriptions no src.");
  }

  const webhook = stripeFiles.find(([file]) => file.includes("webhook"));

  if (webhook) {
    pass(`Webhook Stripe encontrado: ${webhook[0]}`);
  } else {
    warn("Webhook Stripe não encontrado pelo nome do arquivo.");
  }
}

function checkMarketplaceEditor() {
  title("Marketplace e Editor");

  const marketplacePage = read("src/app/marketplace/page.tsx");
  const editorPage = read("src/app/editor/page.tsx");

  if (marketplacePage) {
    pass("Página Marketplace existe.");
  } else {
    warn("Página Marketplace não encontrada.");
  }

  if (editorPage) {
    pass("Página Editor existe.");
  } else {
    warn("Página Editor não encontrada.");
  }

  const editorFiles = listFiles(path.join(root, "src"))
    .filter(isTextFile)
    .filter((file) => rel(file).toLowerCase().includes("editor"))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  if (
    editorFiles.includes("table") ||
    editorFiles.includes("image") ||
    editorFiles.includes("execCommand") ||
    editorFiles.includes("contentEditable")
  ) {
    pass("Editor possui sinais de edição rica.");
  } else {
    warn("Editor existe, mas não encontrei sinais fortes de ferramentas estilo Word.");
  }
}

function checkEncodingAndUserText() {
  title("Texto/encoding/frontend");

  const files = listFiles(path.join(root, "src"))
    .filter(isTextFile)
    .map((file) => [rel(file), fs.readFileSync(file, "utf8")]);

  const mojibake = [];
  const visibleGemini = [];

  for (const [file, text] of files) {
    const suspiciousLines = text
      .split(/\r?\n/)
      .map((line, index) => [index + 1, line])
      .filter(([, line]) => /Ã|Â|â€|�/.test(line));

    for (const [lineNumber, line] of suspiciousLines.slice(0, 8)) {
      mojibake.push(`${file}:${lineNumber}: ${line.trim().slice(0, 140)}`);
    }

    const normalizedFile = file.replaceAll("\\\\", "/").toLowerCase();
    const isUserVisibleFile =
      normalizedFile.startsWith("src/app/") ||
      normalizedFile.startsWith("src/components/") ||
      normalizedFile === "src/lib/navigation.ts";

    const isInternalFile =
      normalizedFile.includes("/api/") ||
      normalizedFile.includes("/server/") ||
      normalizedFile.includes("/types/") ||
      normalizedFile.includes("/config/") ||
      normalizedFile.toLowerCase().includes("gemini");

    if (isUserVisibleFile && !isInternalFile && /Gemini/i.test(text)) {
      visibleGemini.push(file);
    }
  }

  if (mojibake.length === 0) {
    pass("Nenhuma marca forte de encoding quebrado encontrada em src.");
  } else {
    warn(`Possíveis marcas de encoding em ${mojibake.length} ocorrência(s):`);
    for (const item of mojibake.slice(0, 20)) {
      report.push(`   - ${item}`);
    }
  }

  if (visibleGemini.length === 0) {
    pass("Nenhuma referência visual a Gemini encontrada fora de APIs/arquivos internos.");
  } else {
    warn(`Possível referência visual a Gemini em: ${[...new Set(visibleGemini)].join(", ")}`);
  }
}

function writeReport() {
  const outDir = path.join(root, "docs", "auditorias");
  fs.mkdirSync(outDir, { recursive: true });

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `auditoria-final-local-${stamp}.md`);

  const header = [
    "# Planify — Auditoria Final Local",
    "",
    `Data: ${now.toLocaleString("pt-BR")}`,
    "",
    "## Resultado geral",
    "",
    hasFailure
      ? "[ERRO] Existem falhas que precisam ser corrigidas antes de GitHub/deploy."
      : hasWarning
        ? "[AVISO] Não há falhas críticas detectadas, mas existem avisos para revisar."
        : "[OK] Auditoria local sem falhas ou avisos relevantes.",
    "",
  ];

  fs.writeFileSync(outFile, [...header, ...report, ""].join("\n"), "utf8");

  console.log("");
  console.log("===============================================");
  console.log("Planify | Auditoria Final Local");
  console.log("===============================================");
  console.log("");
  console.log(
    hasFailure
      ? "Resultado: FALHAS ENCONTRADAS"
      : hasWarning
        ? "Resultado: OK COM AVISOS"
        : "Resultado: OK"
  );
  console.log("");
  console.log(`Relatório salvo em: ${outFile}`);
  console.log("");

  if (hasFailure) {
    process.exitCode = 1;
  }
}

checkFiles();
checkEnv();
checkPremiumGuard();
checkAdmin();
checkBiblioteca();
checkDocxModels();
checkStripe();
checkMarketplaceEditor();
checkEncodingAndUserText();
writeReport();
