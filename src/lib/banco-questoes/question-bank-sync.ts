import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { computeQuestionContentHash } from "@/lib/banco-questoes/question-bank-hash";
import {
  loadQuestionBankItems,
  saveQuestionBankItems,
} from "@/lib/banco-questoes/question-bank-storage";
import type { QuestionBankItem } from "@/types/question-bank";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUpsert: QuestionBankItem | null = null;
let migrationAttempted = false;

function isLocalOnlyId(id: string): boolean {
  return id.startsWith("qb-");
}

function mergeByContentHash(
  serverItems: QuestionBankItem[],
  localItems: QuestionBankItem[],
): QuestionBankItem[] {
  const byHash = new Map<string, QuestionBankItem>();

  for (const item of serverItems) {
    const hash =
      item.contentHash ||
      computeQuestionContentHash(item.enunciado, item.tipo);
    byHash.set(hash, item);
  }

  for (const item of localItems) {
    const hash =
      item.contentHash ||
      computeQuestionContentHash(item.enunciado, item.tipo);
    const existing = byHash.get(hash);

    if (!existing) {
      byHash.set(hash, item);
      continue;
    }

    const localTime = new Date(item.updatedAt).getTime();
    const serverTime = new Date(existing.updatedAt).getTime();
    if (Number.isFinite(localTime) && localTime > serverTime) {
      byHash.set(hash, { ...item, id: existing.id });
    }
  }

  return Array.from(byHash.values()).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

async function fetchServerItems(
  source: "mine" | "community" | "school",
): Promise<QuestionBankItem[]> {
  const response = await planifyAuthenticatedFetch(
    `/api/banco-questoes?source=${source}`,
    { method: "GET" },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !Array.isArray(data.items)) {
    if (source === "school" && response.status === 403) {
      return [];
    }
    return [];
  }
  return data.items as QuestionBankItem[];
}

async function putServerItem(item: QuestionBankItem): Promise<{
  item: QuestionBankItem;
  duplicate: boolean;
}> {
  const response = await planifyAuthenticatedFetch("/api/banco-questoes/itens", {
    method: "PUT",
    body: JSON.stringify({ item }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Não foi possível salvar a questão.");
  }
  return {
    item: data.item as QuestionBankItem,
    duplicate: Boolean(data.duplicate),
  };
}

async function migrateLocalToServer(
  localItems: QuestionBankItem[],
): Promise<void> {
  const personal = localItems.filter((item) => !item.isCommunity);
  if (!personal.length) return;

  await planifyAuthenticatedFetch("/api/banco-questoes/migrar-local", {
    method: "POST",
    body: JSON.stringify({ items: personal }),
  });
}

export async function loadQuestionBankHybrid(): Promise<{
  mine: QuestionBankItem[];
  community: QuestionBankItem[];
  school: QuestionBankItem[];
}> {
  const local = loadQuestionBankItems();
  const [serverMine, community, school] = await Promise.all([
    fetchServerItems("mine"),
    fetchServerItems("community"),
    fetchServerItems("school"),
  ]);

  const localOnly = local.filter(
    (item) => !item.isCommunity && isLocalOnlyId(item.id),
  );
  const mine = mergeByContentHash(serverMine, localOnly);

  saveQuestionBankItems(
    mine.filter((item) => !item.isCommunity && !item.isSchool),
  );
  return { mine, community, school };
}

export async function syncFromServerOnMount(): Promise<QuestionBankItem[]> {
  const local = loadQuestionBankItems();

  if (!migrationAttempted) {
    migrationAttempted = true;
    const serverMine = await fetchServerItems("mine");
    if (serverMine.length === 0 && local.some((item) => !item.isCommunity)) {
      try {
        await migrateLocalToServer(local);
      } catch {
        /* best-effort migration */
      }
    }
  }

  const { mine, community, school } = await loadQuestionBankHybrid();
  return [...mine, ...community, ...school];
}

function scheduleServerUpsert(item: QuestionBankItem): void {
  pendingUpsert = item;

  if (syncTimer) clearTimeout(syncTimer);

  syncTimer = setTimeout(() => {
    const toSync = pendingUpsert;
    pendingUpsert = null;
    syncTimer = null;
    if (!toSync || toSync.isCommunity) return;
    void putServerItem(toSync).catch(() => {
      /* offline — local já salvo */
    });
  }, 400);
}

export async function upsertQuestionToServerNow(
  item: QuestionBankItem,
): Promise<{ item: QuestionBankItem; duplicate: boolean }> {
  return putServerItem(item);
}

export function upsertQuestionHybrid(item: QuestionBankItem): {
  items: QuestionBankItem[];
  duplicate: boolean;
} {
  const items = loadQuestionBankItems();
  const hash =
    item.contentHash || computeQuestionContentHash(item.enunciado, item.tipo);
  const duplicateIndex = items.findIndex(
    (entry) =>
      entry.id !== item.id &&
      (entry.contentHash ||
        computeQuestionContentHash(entry.enunciado, entry.tipo)) === hash,
  );

  if (duplicateIndex >= 0) {
    return { items, duplicate: true };
  }

  const index = items.findIndex((entry) => entry.id === item.id);
  const next = [...items];
  const enriched = {
    ...item,
    contentHash: hash,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) next[index] = enriched;
  else next.unshift(enriched);

  saveQuestionBankItems(
    next.filter((entry) => !entry.isCommunity && !entry.isSchool),
  );

  if (!enriched.isCommunity) {
    scheduleServerUpsert(enriched);
  }

  return {
    items: next.filter((entry) => !entry.isCommunity && !entry.isSchool),
    duplicate: false,
  };
}

export async function deleteQuestionHybrid(id: string): Promise<void> {
  const items = loadQuestionBankItems().filter((item) => item.id !== id);
  saveQuestionBankItems(items);

  if (!isLocalOnlyId(id)) {
    await planifyAuthenticatedFetch(`/api/banco-questoes/itens/${id}`, {
      method: "DELETE",
    });
  }
}

export async function publishQuestionToSchool(
  questionId: string,
  schoolId?: string,
): Promise<QuestionBankItem> {
  const response = await planifyAuthenticatedFetch(
    "/api/banco-questoes/publicar-escola",
    {
      method: "POST",
      body: JSON.stringify({ questionId, schoolId }),
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Não foi possível compartilhar com a escola.");
  }
  return data.item as QuestionBankItem;
}

export async function publishQuestionToCommunity(
  questionId: string,
): Promise<QuestionBankItem> {
  const response = await planifyAuthenticatedFetch("/api/banco-questoes/publicar", {
    method: "POST",
    body: JSON.stringify({ questionId }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Não foi possível publicar na comunidade.");
  }
  return data.item as QuestionBankItem;
}

export async function incrementQuestionUsage(questionId: string): Promise<void> {
  if (isLocalOnlyId(questionId)) return;
  void planifyAuthenticatedFetch("/api/banco-questoes/uso", {
    method: "POST",
    body: JSON.stringify({ questionId }),
  });
}
