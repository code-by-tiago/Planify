/**
 * Auditoria de rotas públicas e ferramentas (HTTP smoke).
 * Uso: node scripts/audit-system-health.mjs [--base=http://127.0.0.1:3000]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEBUG_ENDPOINT =
  "http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281";
const SESSION_ID = "4ba21b";

const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const baseUrl = (baseArg?.slice("--base=".length) || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function logDebug(hypothesisId, location, message, data) {
  const payload = {
    sessionId: SESSION_ID,
    runId: "audit-system-health",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function loadPublicPaths() {
  const source = readFileSync(join(root, "src/lib/seo/public-paths.ts"), "utf8");
  const matches = [...source.matchAll(/path:\s*"([^"]+)"/g)];
  return matches.map((match) => match[1]);
}

const AUTH_REDIRECT_PATHS = [
  "/materiais",
  "/planejamentos",
  "/inclusao",
  "/editor",
  "/historico",
  "/biblioteca",
  "/dashboard",
  "/login",
];

// These legacy deep links render a tiny client shell and then navigate to the
// dashboard tool. A raw HTTP probe correctly sees 200; browser navigation is
// covered by the Playwright smoke suite.
const CLIENT_REDIRECT_PATHS = ["/aula-completa", "/correcao"];
const LEGACY_REDIRECT_PATHS = ["/banco-questoes"];

const SEO_PATHS = ["/robots.txt", "/sitemap.xml"];

async function probe(path, expectAuthRedirect = false) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const status = response.status;
    const ok =
      status < 500 &&
      (!expectAuthRedirect || status === 307 || status === 308 || status === 302);
    return { path, status, ok, error: null };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const publicPaths = loadPublicPaths();
  const authPaths = AUTH_REDIRECT_PATHS.filter((path) => path !== "/login");
  const checks = [
    ...(await Promise.all(publicPaths.map((path) => probe(path)))),
    ...(await Promise.all(SEO_PATHS.map((path) => probe(path)))),
    ...(await Promise.all(authPaths.map((path) => probe(path, true)))),
    ...(await Promise.all(CLIENT_REDIRECT_PATHS.map((path) => probe(path)))),
    ...(await Promise.all(LEGACY_REDIRECT_PATHS.map((path) => probe(path, true)))),
  ];

  const failures = checks.filter((item) => !item.ok);
  const summary = {
    baseUrl,
    total: checks.length,
    passed: checks.length - failures.length,
    failed: failures.length,
    failures: failures.map((item) => ({
      path: item.path,
      status: item.status,
      error: item.error,
    })),
  };

  logDebug("C", "audit-system-health.mjs:summary", "Route audit complete", summary);

  console.log(`audit-system-health @ ${baseUrl}`);
  console.log(`  total: ${summary.total}  passed: ${summary.passed}  failed: ${summary.failed}`);

  for (const item of checks) {
    const mark = item.ok ? "OK" : "FAIL";
    console.log(`  ${mark}  ${item.path} → ${item.status || item.error}`);
  }

  if (failures.length > 0) {
    process.exit(1);
  }

  console.log("audit-system-health: OK");
}

main().catch((error) => {
  console.error("audit-system-health fatal:", error);
  logDebug("C", "audit-system-health.mjs:fatal", "Audit crashed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
