/**
 * Gate global do ecossistema — generators + sprints + unification + build.
 * Run: npm run verify:ecosystem
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  "npm run typecheck",
  "npm run verify:generators",
  "npm run verify:sprint2",
  "npm run verify:sprint3",
  "npm run verify:sprint4",
  "npm run verify:unification-u1",
  "npm run verify:unification-u2",
  "npm run verify:unification-u3",
  "npm run build",
];

for (const step of steps) {
  console.log(`\n→ ${step}`);
  const [cmd, ...args] = step.split(" ");
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`\nverify:ecosystem FAILED at: ${step}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nverify:ecosystem: OK");
