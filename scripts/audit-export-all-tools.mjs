/**
 * Gate de exportação — delega aos verificadores existentes.
 * Run: node scripts/audit-export-all-tools.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  "npm run verify:export-pipeline",
  "node scripts/verify-export-motors.mjs",
  "node scripts/verify-forms-export-payload.mjs",
  "node scripts/verify-google-export-readiness.mjs",
];

let failed = 0;

for (const command of steps) {
  console.log(`\n→ ${command}`);
  const [cmd, ...args] = command.split(" ");
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    failed += 1;
  }
}

if (failed) {
  console.error(`\naudit-export-all-tools: FAIL (${failed} step(s))`);
  process.exit(1);
}

console.log("\naudit-export-all-tools: OK");
