function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/**
 * Conversor markdown básico para pré-visualização e exportação PDF/DOCX.
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let inList = false;
  let inCodeFence = false;
  const codeLines: string[] = [];

  function closeList() {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  }

  function flushCodeFence() {
    if (!inCodeFence) return;
    parts.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines.length = 0;
    inCodeFence = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const fence = line.trim().match(/^```(\w*)?$/);

    if (fence) {
      closeList();
      if (inCodeFence) {
        flushCodeFence();
      } else {
        inCodeFence = true;
      }
      continue;
    }

    if (inCodeFence) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      parts.push(`<${tag}>${inlineMarkdown(escapeHtml(heading[2]))}</${tag}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${inlineMarkdown(escapeHtml(listItem[1]))}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      closeList();
      parts.push(`<p>${inlineMarkdown(escapeHtml(ordered[1]))}</p>`);
      continue;
    }

    closeList();
    parts.push(`<p>${inlineMarkdown(escapeHtml(line))}</p>`);
  }

  closeList();
  flushCodeFence();
  return parts.join("\n");
}
