const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = process.cwd();

const gitignoreAppend = `
# Planify release safety
node_modules/
.next/
.vercel/
.turbo/
dist/
out/
.env
.env.*
!.env.example
*.bak-*
*.log
`;

const envExample = `# Planify | Environment example
# Copy this file to .env.local and fill real values locally.
# Never commit .env.local.

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLANIFY_ADMIN_EMAIL=owner@example.com
NEXT_PUBLIC_ADMIN_EMAIL=owner@example.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GEMINI_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=

# Google OAuth / future Drive + Classroom export
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=

# Optional production
VERCEL_PROJECT_PRODUCTION_URL=
`;

function backup(file) {
  if (!fs.existsSync(file)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(file, `${file}.bak-9-21-0-${stamp}`);
}

function ensureGitignore() {
  const file = path.join(root, ".gitignore");
  let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";

  backup(file);

  for (const line of gitignoreAppend.trim().split(/\r?\n/)) {
    const value = line.trim();
    if (!value) continue;

    if (!content.split(/\r?\n/).some((existing) => existing.trim() === value)) {
      content += `${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${value}\n`;
    }
  }

  fs.writeFileSync(file, content, "utf8");
  console.log("[OK] .gitignore atualizado com protecoes de release.");
}

function ensureEnvExample() {
  const file = path.join(root, ".env.example");
  backup(file);
  fs.writeFileSync(file, envExample, "utf8");
  console.log("[OK] .env.example criado/atualizado sem chaves reais.");
}

function ensureDeployDocs() {
  const dir = path.join(root, "docs", "deploy");
  fs.mkdirSync(dir, { recursive: true });

  const checklist = `# Planify | Deploy checklist

## Antes do GitHub

1. Rodar build local.
2. Rodar auditoria anti-vazamento.
3. Confirmar que .env.local nao aparece no git status.
4. Confirmar que os modelos DOCX oficiais estao presentes.
5. Confirmar que upload/download de Biblioteca e Marketplace funcionam.

## GitHub

1. Criar repositorio privado no GitHub.
2. Adicionar remote.
3. Fazer push da branch principal.
4. Nunca subir .env.local.

## Deploy

1. Configurar variaveis de ambiente no painel do provedor.
2. Configurar Supabase URLs, service role e anon key.
3. Configurar Stripe keys, prices e webhook.
4. Configurar admin email.
5. Rodar build no deploy.
6. Testar login, planos, premium gate, planejamentos, biblioteca, marketplace e editor.

## Google Drive/Classroom

Implementar em etapa separada e segura:
1. OAuth start/callback.
2. Exportar DOCX ja gerado para Drive.
3. Depois compartilhar/publicar via Classroom.
4. Manter download DOCX como fallback.
`;

  fs.writeFileSync(path.join(dir, "DEPLOY-CHECKLIST.md"), checklist, "utf8");
  console.log("[OK] docs/deploy/DEPLOY-CHECKLIST.md criado.");
}

function runNodeScript(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    console.log(`[AVISO] Script nao encontrado: ${relativePath}`);
    return;
  }

  console.log("");
  console.log(`[RUN] node ${relativePath}`);

  try {
    childProcess.execSync(`node ${relativePath}`, {
      cwd: root,
      stdio: "inherit",
    });
  } catch (error) {
    process.exitCode = 1;
  }
}

ensureGitignore();
ensureEnvExample();
ensureDeployDocs();

runNodeScript("scripts/planify/final/auditoria-anti-vazamento-9-21-0.cjs");
runNodeScript("scripts/planify/final/auditoria-release-final-9-21-0.cjs");
runNodeScript("scripts/planify/final/auditoria-google-classroom-ready-9-21-0.cjs");

console.log("");
console.log("Planify 9.21.0 preparado.");
