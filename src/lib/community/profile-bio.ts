export const COMMUNITY_BIO_MAX_LENGTH = 500;
export const COMMUNITY_BIO_MAX_LINES = 12;

export function normalizeCommunityBio(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const lines = value
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, COMMUNITY_BIO_MAX_LINES);

  if (!lines.length) {
    return null;
  }

  return lines.join("\n").slice(0, COMMUNITY_BIO_MAX_LENGTH);
}

export function splitCommunityBioLines(bio: string | null | undefined): string[] {
  if (!bio) {
    return [];
  }

  return bio
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function communityBioUsesTopics(bio: string | null | undefined): boolean {
  return splitCommunityBioLines(bio).length > 1;
}
