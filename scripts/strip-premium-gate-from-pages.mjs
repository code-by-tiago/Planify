#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const appRoot = join(root, "src", "app", "(app)");

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (entry === "page.tsx") acc.push(full);
  }
  return acc;
}

for (const path of walk(appRoot)) {
  if (path.endsWith("layout.tsx")) continue;

  let content = readFileSync(path, "utf8");
  if (!content.includes("PremiumAccessGate")) continue;

  content = content.replace(
    /^import PremiumAccessGate from "@\/components\/premium\/PremiumAccessGate";\n/m,
    "",
  );
  content = content.replace(
    /<PremiumAccessGate[^>]*>([\s\S]*?)<\/PremiumAccessGate>/m,
    (_, inner) => inner.trim(),
  );

  writeFileSync(path, content, "utf8");
  console.log(`stripped: ${path.replace(/\\/g, "/").slice(root.length + 1)}`);
}

console.log("done");
