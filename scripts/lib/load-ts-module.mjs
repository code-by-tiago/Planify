/**
 * Carrega módulos TypeScript do src/ em scripts Node (sem Next.js).
 * Resolve @/ e imports relativos; falha com mensagem clara.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const moduleCache = new Map();

function resolveAlias(specifier, root) {
  const rel = `src/${specifier.slice(2)}`;
  const candidates = [
    `${rel}.ts`,
    `${rel}.tsx`,
    `${rel}/index.ts`,
    `${rel}/index.tsx`,
  ];
  for (const candidate of candidates) {
    const full = join(root, candidate);
    if (existsSync(full)) {
      return candidate.replace(/\\/g, "/");
    }
  }
  return null;
}

function resolveRelative(specifier, fromDir, root) {
  const resolved = join(fromDir, specifier);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    join(resolved, "index.ts"),
    join(resolved, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
    return rel;
  }
  return null;
}

export function createTsModuleLoader(root = defaultRoot) {
  function loadTsModule(relativePath) {
    const normalized = relativePath.replace(/\\/g, "/");
    if (moduleCache.has(normalized)) {
      return moduleCache.get(normalized);
    }

    const ts = require("typescript");
    const sourcePath = join(root, normalized);
    if (!existsSync(sourcePath)) {
      throw new Error(`loadTsModule: arquivo não encontrado: ${normalized}`);
    }

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
        const rel = resolveAlias(specifier, root);
        if (!rel) {
          throw new Error(`Cannot resolve alias ${specifier}`);
        }
        return loadTsModule(rel);
      }
      if (specifier.startsWith(".")) {
        const rel = resolveRelative(specifier, dirname(sourcePath), root);
        if (!rel) {
          throw new Error(`Cannot resolve relative ${specifier} from ${normalized}`);
        }
        return loadTsModule(rel);
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
    moduleCache.set(normalized, module.exports);
    return module.exports;
  }

  return { loadTsModule };
}

export const { loadTsModule } = createTsModuleLoader();
