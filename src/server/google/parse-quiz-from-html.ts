import { parseHTML } from "linkedom";

export type ParsedQuizQuestion = {
  statement: string;
  options: string[];
  type: "multipla-escolha" | "dissertativa" | "verdadeiro-falso" | "completar";
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function collectOptions(card: Element): string[] {
  const options: string[] = [];
  const lists = card.querySelectorAll("ol.planify-questao-options, ul.planify-questao-options");

  if (lists.length) {
    for (const list of lists) {
      for (const li of list.querySelectorAll(":scope > li")) {
        const text = stripTags(li.innerHTML || li.textContent || "");
        if (text) options.push(text);
      }
    }
    return options;
  }

  for (const li of card.querySelectorAll("ol > li, ul > li")) {
    const text = stripTags(li.innerHTML || li.textContent || "");
    if (text) options.push(text);
  }

  return options;
}

function resolveQuestionType(
  rawType: string,
  options: string[],
): ParsedQuizQuestion["type"] {
  const normalized = rawType.toLowerCase();

  if (normalized.includes("multipla") || normalized.includes("múltipla")) {
    return "multipla-escolha";
  }
  if (normalized.includes("verdadeiro") || normalized.includes("falso")) {
    return "verdadeiro-falso";
  }
  if (normalized.includes("completar")) {
    return "completar";
  }
  if (options.length >= 2) {
    return "multipla-escolha";
  }

  return "dissertativa";
}

function isQuestionCard(element: Element): boolean {
  if (element.closest(".planify-gabarito-block, .planify-gabarito-table")) {
    return false;
  }

  const className = element.getAttribute("class") || "";
  if (/planify-questao/i.test(className)) {
    return true;
  }

  return Boolean(
    element.querySelector(".planify-questao-statement, .planify-questao-options"),
  );
}

function extractStatement(card: Element): string {
  const statementEl =
    card.querySelector(".planify-questao-statement") ||
    card.querySelector("p");

  return stripTags(statementEl?.innerHTML || statementEl?.textContent || "");
}

function parseQuestionCard(card: Element): ParsedQuizQuestion | null {
  const statement = extractStatement(card);
  if (!statement || statement.length < 3) {
    return null;
  }

  const options = collectOptions(card);
  const typeEl = card.querySelector(".planify-questao-type");
  const rawType = typeEl ? stripTags(typeEl.textContent || "") : "";

  return {
    statement,
    options,
    type: resolveQuestionType(rawType, options),
  };
}

function findQuestionCards(document: Document): Element[] {
  const explicit = [
    ...document.querySelectorAll(
      "article.planify-questao, .planify-questao-card, [class*='planify-questao-card']",
    ),
  ].filter(isQuestionCard);

  if (explicit.length) {
    return explicit;
  }

  const blockCards = [
    ...document.querySelectorAll(
      ".planify-questoes-block > article, .planify-questoes-block > div, .planify-questoes-block-direct > article, .planify-questoes-block-direct > div",
    ),
  ].filter(isQuestionCard);

  return blockCards;
}

/** Extrai questões do HTML gerado pelo motor de materiais (planify-questao). */
export function parseQuizQuestionsFromHtml(html: string): ParsedQuizQuestion[] {
  const source = String(html || "").trim();
  if (!source) return [];

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${source}</body></html>`,
  );

  const questions: ParsedQuizQuestion[] = [];

  for (const card of findQuestionCards(document)) {
    const parsed = parseQuestionCard(card);
    if (parsed) {
      questions.push(parsed);
    }
  }

  if (questions.length) {
    return questions;
  }

  // Fallback legado (regex) para HTML mínimo sem DOM estável.
  const articlePattern =
    /<article[^>]*class=["'][^"']*planify-questao[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;

  let match: RegExpExecArray | null;
  while ((match = articlePattern.exec(source)) !== null) {
    const block = match[1];
    const statementMatch = block.match(
      /<p[^>]*class=["'][^"']*planify-questao-statement[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    );
    const statement = statementMatch ? stripTags(statementMatch[1]) : "";
    if (!statement) continue;

    const options: string[] = [];
    const optionPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let optionMatch: RegExpExecArray | null;
    while ((optionMatch = optionPattern.exec(block)) !== null) {
      const option = stripTags(optionMatch[1]);
      if (option) options.push(option);
    }

    const typeMatch = block.match(
      /<span[^>]*class=["'][^"']*planify-questao-type[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    );
    const rawType = typeMatch ? stripTags(typeMatch[1]) : "";

    questions.push({
      statement,
      options,
      type: resolveQuestionType(rawType, options),
    });
  }

  return questions;
}
