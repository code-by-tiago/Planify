/** Smoke suite for the curated/authorized question bank feed contract. */
import assert from "node:assert/strict";
import { validateApprovedFeedDefinition } from "./lib/question-bank-ingest/sources/approved-feeds.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
    failed += 1;
  }
}

const validFeed = {
  id: "instituicao-parceira-enem",
  name: "Instituição parceira — provas ENEM",
  url: "https://dados.exemplo.edu.br/questoes.json",
  license: "Licença institucional para redistribuição",
  humanReviewed: true,
  reviewedBy: "Equipe editorial parceira",
  kind: "licensed",
  collection: "enem",
};

test("aceita feed HTTPS licenciado e revisado por humanos", () => {
  const result = validateApprovedFeedDefinition(validFeed);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.feed.collection, "enem");
    assert.equal(result.feed.kind, "licensed");
  }
});

test("bloqueia fonte sem declaração de revisão humana", () => {
  const result = validateApprovedFeedDefinition({ ...validFeed, humanReviewed: false });
  assert.deepEqual(result, { ok: false, reason: "fonte_sem_revisao_humana" });
});

test("bloqueia URL não HTTPS e hosts locais", () => {
  assert.equal(
    validateApprovedFeedDefinition({ ...validFeed, url: "http://127.0.0.1/feed.json" }).ok,
    false,
  );
  assert.equal(
    validateApprovedFeedDefinition({ ...validFeed, url: "https://localhost/feed.json" }).ok,
    false,
  );
});

test("bloqueia feed sem licença ou coleção conhecida", () => {
  assert.equal(validateApprovedFeedDefinition({ ...validFeed, license: "" }).ok, false);
  assert.equal(validateApprovedFeedDefinition({ ...validFeed, collection: "comercial" }).ok, false);
});

console.log(`\nverify-question-bank-curation: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
