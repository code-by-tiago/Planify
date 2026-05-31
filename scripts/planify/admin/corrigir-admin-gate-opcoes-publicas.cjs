const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function ensureAdminEnv() {
  const envPath = path.join(root, ".env.local");
  let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  if (!/PLANIFY_ADMIN_EMAIL\s*=/.test(text)) {
    text += `${text.endsWith("\n") || text.length === 0 ? "" : "\n"}PLANIFY_ADMIN_EMAIL=ts162351@gmail.com\n`;
    fs.writeFileSync(envPath, text, "utf8");
    console.log("OK: PLANIFY_ADMIN_EMAIL adicionado ao .env.local");
  } else {
    console.log("OK: PLANIFY_ADMIN_EMAIL já existe no .env.local");
  }
}

function patchMiddleware(file) {
  if (!fs.existsSync(file)) return;

  let text = fs.readFileSync(file, "utf8");

  if (text.includes("PLANIFY_ADMIN_GATE_PUBLIC_OPTIONS_9154")) {
    console.log(`OK: middleware já ajustado: ${path.relative(root, file)}`);
    return;
  }

  const marker = /export\s+(?:async\s+)?function\s+middleware\s*\(\s*request\s*:\s*NextRequest\s*\)\s*\{/;

  if (!marker.test(text)) {
    console.log(`AVISO: não achei função middleware em ${path.relative(root, file)}`);
    return;
  }

  text = text.replace(marker, (match) => `${match}
  // PLANIFY_ADMIN_GATE_PUBLIC_OPTIONS_9154
  // Admin tem guarda própria e não deve cair no fluxo de professor premium.
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }
`);

  fs.writeFileSync(file, text, "utf8");
  console.log(`OK: bypass admin aplicado em ${path.relative(root, file)}`);
}

function removePublicAdminLinks() {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;

      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
        files.push(full);
      }
    }
  }

  walk(path.join(root, "src"));

  for (const file of files) {
    const relative = path.relative(root, file);

    if (relative.includes(`${path.sep}app${path.sep}admin${path.sep}`)) continue;
    if (relative.endsWith(`${path.sep}app${path.sep}admin${path.sep}page.tsx`)) continue;

    let text = fs.readFileSync(file, "utf8");
    const original = text;

    text = text
      .replace(/\{\s*href:\s*["']\/admin["']\s*,\s*label:\s*["']Admin["']\s*\}\s*,?/g, "")
      .replace(/\{\s*label:\s*["']Admin["']\s*,\s*href:\s*["']\/admin["']\s*\}\s*,?/g, "")
      .replace(/<Link[^>]+href=["']\/admin["'][\s\S]*?<\/Link>/g, "")
      .replace(/<a[^>]+href=["']\/admin["'][\s\S]*?<\/a>/g, "");

    if (text !== original) {
      fs.writeFileSync(file, text, "utf8");
      console.log(`OK: link público Admin removido de ${relative}`);
    }
  }
}

ensureAdminEnv();
patchMiddleware(path.join(root, "middleware.ts"));
patchMiddleware(path.join(root, "src", "middleware.ts"));
removePublicAdminLinks();
