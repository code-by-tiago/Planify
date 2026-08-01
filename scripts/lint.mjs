import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const roots = ["src", "scripts", "e2e"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const allowedDebugEndpointFiles = new Set(["src/lib/debug/agent-debug-log.ts"]);
const forbiddenDebugEndpoint = "7718" + "/ingest";
const failures = [];

function extname(file) {
  const index = file.lastIndexOf(".");
  return index >= 0 ? file.slice(index) : "";
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;

    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      walk(full);
      continue;
    }

    if (!extensions.has(extname(entry))) continue;

    const source = readFileSync(full, "utf8");
    const rel = relative(root, full).replace(/\\/g, "/");

    if (/^(<<<<<<<|=======|>>>>>>>) /m.test(source)) {
      failures.push(`${rel}: marcador de conflito Git encontrado`);
    }

    if (
      source.includes(forbiddenDebugEndpoint) &&
      !allowedDebugEndpointFiles.has(rel)
    ) {
      failures.push(`${rel}: endpoint de debug ${forbiddenDebugEndpoint} encontrado`);
    }
  }
}

for (const dir of roots) {
  walk(join(root, dir));
}

if (failures.length > 0) {
  console.error("lint failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("lint passed");
