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
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/** Extrai questões do HTML gerado pelo motor de materiais (planify-questao). */
export function parseQuizQuestionsFromHtml(html: string): ParsedQuizQuestion[] {
  const questions: ParsedQuizQuestion[] = [];
  const articlePattern =
    /<article[^>]*class="[^"]*planify-questao[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;

  let match: RegExpExecArray | null;

  while ((match = articlePattern.exec(html)) !== null) {
    const block = match[1];
    const statementMatch = block.match(
      /<p[^>]*class="[^"]*planify-questao-statement[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    );
    const typeMatch = block.match(
      /<span[^>]*class="[^"]*planify-questao-type[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
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

    const rawType = typeMatch ? stripTags(typeMatch[1]).toLowerCase() : "";
    let type: ParsedQuizQuestion["type"] = "dissertativa";

    if (rawType.includes("multipla") || rawType.includes("múltipla")) {
      type = "multipla-escolha";
    } else if (rawType.includes("verdadeiro") || rawType.includes("falso")) {
      type = "verdadeiro-falso";
    } else if (rawType.includes("completar")) {
      type = "completar";
    } else if (options.length >= 2) {
      type = "multipla-escolha";
    }

    questions.push({ statement, options, type });
  }

  return questions;
}
