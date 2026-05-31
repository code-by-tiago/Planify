import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  return null;
}

export async function requireUser(): Promise<User | null> {
  return null;
}

export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return "Professor";
  }

  const metadata = user.user_metadata || {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";

  return fullName || user.email || "Professor";
}
