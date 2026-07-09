#!/usr/bin/env node
/**
 * Smoke checks for Copiloto voice→brief→generation flow wiring.
 * Run: node scripts/verify-copiloto.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/app/copiloto/CopilotoClient.tsx",
  "src/lib/copiloto/copiloto-client.ts",
  "src/lib/copiloto/copiloto-api-contract.ts",
  "src/lib/copiloto/copiloto-utils.ts",
  "src/lib/copiloto/gap-fill.ts",
  "src/app/api/copiloto/transcrever/route.ts",
  "src/app/api/copiloto/interpretar/route.ts",
  "src/server/copiloto/copiloto-rate-limit-service.ts",
  "src/server/copiloto/copiloto-transcribe-service.ts",
  "src/server/copiloto/copiloto-interpret-service.ts",
];

const requiredSnippets = [
  {
    file: "src/lib/copiloto/copiloto-client.ts",
    includes: [
      "idempotencyKey",
      "generationSource",
      "TRANSCRIBE_TIMEOUT_MS",
      "throwCopilotoApiError",
    ],
  },
  {
    file: "src/app/copiloto/CopilotoClient.tsx",
    includes: [
      "lastEditorMeta",
      "generationIdempotencyRef",
      "GenerationErrorBanner",
      "recordModeRef.current",
      "cancelActiveGeneration",
      "generationSource: COPILOTO_SOURCE",
    ],
  },
  {
    file: "src/lib/copiloto/gap-fill.ts",
    includes: ["contextText", "brief.tema"],
  },
  {
    file: "src/app/api/copiloto/transcrever/route.ts",
    includes: ["consumeCopilotoTranscribeRateLimit", "error: { message"],
  },
  {
    file: "src/app/api/copiloto/interpretar/route.ts",
    includes: ["consumeCopilotoInterpretRateLimit", "copiloto_interpret"],
  },
  {
    file: "src/server/copiloto/copiloto-interpret-service.ts",
    includes: ["alinhamentoAviso"],
  },
  {
    file: "src/server/ai/gemini-client.ts",
    includes: ["withGeminiCallTimeout", "Transcrição multimodal"],
  },
  {
    file: "src/lib/materiais/elevate-material-client.ts",
    includes: ["options?: { signal?: AbortSignal }"],
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
  if (!existsSync(path)) {
    console.error(`MISSING FILE FOR SNIPPET: ${check.file}`);
    failed += 1;
    continue;
  }
  const content = readFileSync(path, "utf8");
  for (const snippet of check.includes || []) {
    if (!content.includes(snippet)) {
      console.error(`MISSING SNIPPET "${snippet}" in ${check.file}`);
      failed += 1;
    }
  }
}

function extractCopilotoApiMessage(data, fallback) {
  return data?.error?.message?.trim() || data?.message?.trim() || fallback;
}

const authMessage = extractCopilotoApiMessage(
  { success: false, error: { message: "Autenticação necessária." } },
  "fallback",
);
if (authMessage !== "Autenticação necessária.") {
  console.error("auth error contract should expose error.message");
  failed += 1;
}

const allowedAudio = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
]);
if (!allowedAudio.has("audio/webm") || allowedAudio.has("video/mp4")) {
  console.error("audio mime allowlist sanity failed");
  failed += 1;
}

if (failed > 0) {
  console.error(`\nverify:copiloto FAILED (${failed} checks)`);
  process.exit(1);
}

console.log("verify:copiloto OK");
