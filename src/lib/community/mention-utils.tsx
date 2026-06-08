import Link from "next/link";
import type { ReactNode } from "react";

const MENTION_PATTERN = /@([A-Za-zÀ-ÿ0-9_.-]{2,40})/g;

export function parseMentionSegments(body: string): Array<{ type: "text" | "mention"; value: string }> {
  const segments: Array<{ type: "text" | "mention"; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pattern = new RegExp(MENTION_PATTERN.source, "g");

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: body.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", value: match[1] });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", value: body.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: body }];
}

export function renderCommentBodyWithMentions(
  body: string,
  mentionLinks?: Map<string, string>,
): ReactNode {
  const segments = parseMentionSegments(body);

  return segments.map((segment, index) => {
    if (segment.type === "text") {
      return <span key={`t-${index}`}>{segment.value}</span>;
    }

    const userId = mentionLinks?.get(segment.value.toLowerCase());

    if (userId) {
      return (
        <Link
          key={`m-${index}`}
          href={`/marketplace/perfil/${userId}`}
          className="font-bold text-cyan-700 hover:underline"
        >
          @{segment.value}
        </Link>
      );
    }

    return (
      <span key={`m-${index}`} className="font-bold text-cyan-700">
        @{segment.value}
      </span>
    );
  });
}
