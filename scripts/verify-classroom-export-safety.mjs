/**
 * Verificação estática + unitária — segurança export Google Classroom.
 * Run: npm run verify:classroom-export-safety
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
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
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      const candidates = [`${resolved}.ts`, `${resolved}.js`];
      for (const candidate of candidates) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate.replace(/\\/g, "/"));
        } catch {
          /* try next */
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

console.log("verify:classroom-export-safety");

// --- Static guards ---
assert.ok(
  !existsSync(join(root, "src/components/google/GoogleClassroomExportButton.tsx")),
  "GoogleClassroomExportButton.tsx must not exist (one-click removed)",
);

const hookSource = read("src/hooks/useGoogleClassroomExport.ts");
assert.match(hookSource, /buildClassroomExportSuccessMessage/);
assert.match(hookSource, /assertClassroomClientExportAllowed/);
assert.match(hookSource, /useState\(true\)/, "publishAsDraft defaults to true (rascunho)");
assert.match(hookSource, /canShowTurmaList/);
assert.match(hookSource, /canSubmitExport/);
assert.match(hookSource, /statusReady/);
assert.doesNotMatch(
  hookSource,
  /saveGoogleExportPending\(GOOGLE_CLASSROOM_EXPORT_PENDING_KEY/,
  "OAuth connect must not save Classroom export pending",
);
assert.doesNotMatch(hookSource, /handleQuickExport/, "handleQuickExport removed");
assert.doesNotMatch(
  hookSource,
  /const canExport = .*Boolean\(courseId\)/,
  "canExport must not gate turma list on courseId",
);

const popoverSource = read("src/components/google/GoogleClassroomPopoverButton.tsx");
assert.match(popoverSource, /Enviar à turma/);
assert.match(popoverSource, /Selecione a turma/);
assert.match(popoverSource, /Abrir no Classroom/);
assert.match(popoverSource, /renderPopoverBody/, "popover must always render body content");
assert.match(popoverSource, /statusReady/);
assert.match(popoverSource, /effectiveCoords/);
assert.match(popoverSource, /openClassroomPopover/);
assert.match(popoverSource, /Trocar conta Google/);

const accountSource = read("src/lib/google/classroom-google-account.ts");
assert.match(accountSource, /classroomGoogleAccountIncomplete/);
assert.match(accountSource, /needsEducarClassroomConnect/);

const flowSource = read("src/lib/google/classroom-export-flow.ts");
assert.match(
  flowSource,
  /Selecione a turma antes de enviar ao Google Classroom/,
);
assert.doesNotMatch(flowSource, /7718\/ingest/, "no debug ingest in classroom-export-flow");
assert.doesNotMatch(flowSource, /return courses\[0\]\?\.id/, "must not auto-pick first course");

const routeSource = read("src/app/api/google/classroom/export/route.ts");
assert.match(routeSource, /classroom-export-persistent-guard/);
assert.match(routeSource, /"DRAFT"/, "API defaults to DRAFT");

assert.ok(
  existsSync("supabase/migrations/20260628180000_google_classroom_export_guards.sql"),
  "Supabase migration for persistent dedup must exist",
);

const oauthResume = read("src/lib/google/google-oauth-resume.ts");
assert.match(
  oauthResume,
  /GOOGLE_CLASSROOM_EXPORT_PENDING_KEY[\s\S]*clearActivePending/,
  "OAuth resume clears Classroom pending without auto-post",
);

const exportBar = read("src/components/google/GoogleDocumentExportBar.tsx");
assert.match(exportBar, /GoogleClassroomPopoverButton/);

for (const file of [
  "src/hooks/useGoogleClassroomExport.ts",
  "src/server/planejamentos/planning-lesson-allocation.ts",
  "src/components/google/GoogleClassroomPopoverButton.tsx",
]) {
  assert.doesNotMatch(read(file), /7718\/ingest/, `no inline debug ingest in ${file}`);
}

// --- Unit: server dedup ---
const dedup = loadTsModule("src/server/google/classroom-export-dedup.ts");
const key = dedup.buildClassroomExportDedupKey({
  userId: "user-1",
  courseId: "course-1",
  title: "Teste",
  html: "<p>conteudo</p>",
});

dedup.assertClassroomExportAllowed(key);
dedup.recordClassroomExportDedup(key);

let blocked = false;
try {
  dedup.assertClassroomExportAllowed(key);
} catch (error) {
  blocked = error instanceof Error && /já foi enviado/i.test(error.message);
}
assert.ok(blocked, "server dedup blocks duplicate within TTL");

// --- Unit: preferred course (no auto-first when multiple) ---
const { resolvePreferredClassroomCourseId } = loadTsModule(
  "src/lib/google/classroom-export-flow.ts",
);

assert.equal(
  resolvePreferredClassroomCourseId([
    { id: "a", name: "Turma A" },
    { id: "b", name: "Turma B" },
  ]),
  "",
  "multiple courses without saved preference → empty (explicit selection)",
);

assert.equal(
  resolvePreferredClassroomCourseId([{ id: "only", name: "Única" }]),
  "only",
  "single course → auto-select OK",
);

assert.ok(
  existsSync("e2e/classroom-export-safety.spec.ts"),
  "Playwright safety spec for Classroom export must exist",
);

console.log("OK — classroom export safety checks passed");
