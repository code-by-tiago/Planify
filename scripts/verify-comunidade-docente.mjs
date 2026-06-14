#!/usr/bin/env node
/**
 * Smoke checks for Comunidade Docente routes and source wiring.
 * Run: node scripts/verify-comunidade-docente.mjs
 * Optional: BASE_URL=http://localhost:3000 node scripts/verify-comunidade-docente.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const baseUrl = process.env.BASE_URL || "";

const requiredFiles = [
  "src/components/community/docente/ComunidadeDocenteClient.tsx",
  "src/components/community/docente/ComunidadeDashboardRouter.tsx",
  "src/components/community/docente/ComunidadeDocenteGroupChat.tsx",
  "src/server/community/community-group-messages-service.ts",
  "src/server/community/community-rate-limit-service.ts",
  "src/server/community/community-hidden-feed-materials-service.ts",
  "src/server/community/community-bncc-challenge-service.ts",
  "src/app/api/community/docente/route.ts",
  "src/app/api/community/docente/actions/route.ts",
  "src/app/api/community/docente/grupo/[id]/messages/route.ts",
  "src/app/api/community/docente/challenges/bncc/route.ts",
  "src/app/api/community/hidden-feed-materials/route.ts",
  "supabase/migrations/20260614_community_docente_v3.sql",
  "supabase/migrations/20260614140000_community_confidence.sql",
];

const requiredSnippets = [
  {
    file: "src/server/community/community-group-messages-service.ts",
    includes: ["notifyGroupChatMembers", "consumeCommunityRateLimit"],
  },
  {
    file: "src/app/api/community/docente/actions/route.ts",
    includes: ["consumeCommunityRateLimit"],
  },
  {
    file: "src/lib/community/docente-utils.ts",
    includes: ["hiddenOnly", "mapComunidadeHrefToEmbed", "resolveComunidadeEmbedFromLocation"],
  },
  {
    file: "src/components/community/docente/ComunidadeDocenteGroupChat.tsx",
    includes: ["broadcast", "handleReport", "postgres_changes"],
  },
];

let failed = 0;

for (const relative of requiredFiles) {
  const path = join(root, relative);
  if (!existsSync(path)) {
    console.error(`MISSING FILE: ${relative}`);
    failed += 1;
  }
}

for (const check of requiredSnippets) {
  const path = join(root, check.file);
  const content = readFileSync(path, "utf8");
  for (const snippet of check.includes) {
    if (!content.includes(snippet)) {
      console.error(`MISSING SNIPPET "${snippet}" in ${check.file}`);
      failed += 1;
    }
  }
}

async function pingApi(pathname) {
  if (!baseUrl) return;
  const url = `${baseUrl.replace(/\/$/, "")}${pathname}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    if (response.status === 404) {
      console.error(`API 404: ${pathname}`);
      failed += 1;
      return;
    }
    console.log(`API OK (${response.status}): ${pathname}`);
  } catch (error) {
    console.error(`API FAIL: ${pathname}`, error instanceof Error ? error.message : error);
    failed += 1;
  }
}

if (baseUrl) {
  await pingApi("/api/community/docente");
  await pingApi("/api/community/docente/challenges/bncc");
  await pingApi("/api/community/hidden-feed-materials");
} else {
  console.log("Skip live API ping (set BASE_URL to enable).");
}

if (failed > 0) {
  console.error(`\nComunidade Docente verify FAILED (${failed} issue(s)).`);
  process.exit(1);
}

console.log("\nComunidade Docente verify PASSED.");
