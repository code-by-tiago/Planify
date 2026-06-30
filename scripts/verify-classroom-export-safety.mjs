/**
 * Verificacao estatica + unitaria: Google Classroom API real com revisao segura.
 * Run: npm run verify:classroom-export-safety
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(join(root, relativePath));
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
        if (candidate.endsWith(".ts") && existsSync(candidate)) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        if (existsSync(join(root, candidate))) {
          return loadTsModule(candidate.replace(/\\/g, "/"));
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

for (const route of [
  "src/app/api/google/classroom/auth/route.ts",
  "src/app/api/google/classroom/callback/route.ts",
  "src/app/api/google/classroom/courses/route.ts",
  "src/app/api/google/classroom/share/route.ts",
  "src/app/api/google/classroom/export/route.ts",
]) {
  assert.ok(exists(route), `Classroom route missing: ${route}`);
}

assert.ok(
  !exists("src/components/google/GoogleClassroomExportButton.tsx"),
  "Legacy one-click Classroom button must not exist",
);

const googleConfigSource = read("src/server/google/google-config.ts");
assert.match(googleConfigSource, /classroom\.courses\.readonly/);
assert.match(googleConfigSource, /classroom\.courseworkmaterials/);
assert.match(googleConfigSource, /classroom\.coursework\.students/);
assert.match(googleConfigSource, /GOOGLE_CLASSROOM_REQUIRED_SCOPES/);

const oauthAuthRoute = read("src/app/api/google/classroom/auth/route.ts");
const oauthCallbackRoute = read("src/app/api/google/classroom/callback/route.ts");
assert.match(oauthAuthRoute, /oauth\/start\/route/);
assert.match(oauthCallbackRoute, /oauth\/callback\/route/);

const coursesRouteSource = read("src/app/api/google/classroom/courses/route.ts");
assert.match(coursesRouteSource, /listGoogleClassroomCourses/);
assert.match(coursesRouteSource, /GOOGLE_CLASSROOM_COURSES_SCOPES/);
assert.match(coursesRouteSource, /status:\s*errorStatusFor\(message\)/);
assert.match(coursesRouteSource, /limitou temporariamente|resource_exhausted/i);
assert.doesNotMatch(coursesRouteSource, /status:\s*410/);

const googleClassroomServer = read("src/server/google/google-classroom.ts");
assert.match(googleClassroomServer, /teacherId:\s*"me"/);
assert.match(googleClassroomServer, /courseWorkMaterials/);
assert.match(googleClassroomServer, /courseWork/);
assert.match(googleClassroomServer, /fetch\(/);
assert.match(googleClassroomServer, /shareMode:\s*"VIEW"/);
assert.doesNotMatch(googleClassroomServer, /Publicacao direta no Classroom foi removida/);

const exportServiceSource = read("src/server/google/google-export-service.ts");
assert.match(exportServiceSource, /GOOGLE_CLASSROOM_REQUIRED_SCOPES/);
assert.match(exportServiceSource, /publishDriveFileToClassroom/);
assert.match(exportServiceSource, /courseIds/);
assert.doesNotMatch(exportServiceSource, /classroom\.google\.com\/share/);

const shareApiSource = read("src/server/google/classroom-share-api.ts");
assert.match(shareApiSource, /handleGoogleClassroomShareRequest/);
assert.match(shareApiSource, /courseIds/);
assert.match(shareApiSource, /dueDate/);
assert.match(shareApiSource, /maxPoints/);
assert.doesNotMatch(shareApiSource, /publishState/);

const apiClientSource = read("src/lib/google/google-api-client.ts");
assert.match(apiClientSource, /fetchClassroomCourses/);
assert.match(apiClientSource, /shareToGoogleClassroom/);
assert.match(apiClientSource, /\/api\/google\/classroom\/share/);

const hookSource = read("src/hooks/useGoogleClassroomExport.ts");
assert.match(hookSource, /selectedCourseIds/);
assert.match(hookSource, /setSelectedCourseIds/);
assert.match(hookSource, /canSubmitExport/);
assert.match(hookSource, /dueDate/);
assert.match(hookSource, /maxPoints/);
assert.match(hookSource, /executeClassroomMaterialExport/);
assert.match(hookSource, /forceRefresh/);
assert.match(hookSource, /refreshCourses/);
assert.doesNotMatch(
  hookSource,
  /saveGoogleExportPending\(GOOGLE_CLASSROOM_EXPORT_PENDING_KEY/,
  "OAuth connect must not save pending auto-publish jobs",
);

const classroomFlowSource = read("src/lib/google/classroom-export-flow.ts");
assert.match(classroomFlowSource, /CLASSROOM_COURSES_CACHE_TTL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
assert.match(classroomFlowSource, /sessionStorage\.getItem\(CLASSROOM_COURSES_CACHE_KEY\)/);
assert.match(classroomFlowSource, /classroomCoursesInFlight/);
assert.match(classroomFlowSource, /GOOGLE_CLASSROOM_RATE_LIMIT_MESSAGE/);

const modalSource = read("src/components/google/GoogleClassroomShareModal.tsx");
assert.match(modalSource, /Enviar para Google Classroom/);
assert.match(modalSource, /type="checkbox"/);
assert.match(modalSource, /type="radio"/);
assert.match(modalSource, /type="date"/);
assert.match(modalSource, /type="time"/);
assert.match(modalSource, /Nota maxima/);
assert.match(modalSource, /Publicar novamente/);
assert.match(modalSource, /Abrir no Google Classroom/);
assert.match(modalSource, /refreshCourses\(true\)/);

const popoverSource = read("src/components/google/GoogleClassroomPopoverButton.tsx");
assert.match(popoverSource, /Enviar ao Classroom/);
assert.match(popoverSource, /hasPublishableDocument/);
assert.doesNotMatch(popoverSource, /renderPopoverBody/);
assert.doesNotMatch(popoverSource, /Preparar e abrir/);

const indicatorSource = read("src/components/google/GoogleClassroomConnectionIndicator.tsx");
assert.match(indicatorSource, /Google Classroom conectado/);
assert.match(indicatorSource, /Reconectar Google/);

assert.ok(
  exists("supabase/migrations/20260628180000_google_classroom_export_guards.sql"),
  "Supabase migration for persistent dedup must exist",
);

const exportBar = read("src/components/google/GoogleDocumentExportBar.tsx");
assert.match(exportBar, /GoogleClassroomPopoverButton/);

for (const file of [
  "src/hooks/useGoogleClassroomExport.ts",
  "src/components/google/GoogleClassroomPopoverButton.tsx",
  "src/components/google/GoogleClassroomShareModal.tsx",
]) {
  assert.doesNotMatch(read(file), /7718\/ingest/, `no inline debug ingest in ${file}`);
}

const dedup = loadTsModule("src/server/google/classroom-export-dedup.ts");
const key = dedup.buildClassroomExportDedupKey({
  userId: "user-1",
  courseId: "course-a,course-b",
  title: "Teste",
  html: "<p>conteudo</p>",
});

dedup.assertClassroomExportAllowed(key);
dedup.recordClassroomExportDedup(key);

let blocked = false;
try {
  dedup.assertClassroomExportAllowed(key);
} catch (error) {
  blocked = error instanceof Error && /publicado.*turma/i.test(error.message);
}
assert.ok(blocked, "server dedup blocks duplicate within TTL");

const account = loadTsModule("src/lib/google/classroom-google-account.ts");

assert.equal(
  account.isClassroomExportReady({
    connected: true,
    googleEmail: "professor@gmail.com",
    classroomScopeGranted: true,
    missingClassroomScopes: [],
  }),
  true,
  "valid professor Google account with scopes is ready",
);

assert.equal(
  account.needsEducarClassroomConnect({
    connected: true,
    googleEmail: "professor@educar.rs.gov.br",
    classroomScopeGranted: false,
    missingClassroomScopes: [
      "https://www.googleapis.com/auth/classroom.courseworkmaterials",
    ],
  }),
  true,
  "missing Classroom scope must ask for Google authorization",
);

assert.ok(
  exists("e2e/classroom-export-safety.spec.ts"),
  "Playwright safety spec for Classroom export must exist",
);

console.log("OK - classroom api review safety checks passed");
