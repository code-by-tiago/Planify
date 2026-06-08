import type { User } from "@supabase/supabase-js";
import {
  getUserDisplayName,
  resolveDisplayNameFromSources,
} from "./user-display-name";

export async function getCurrentUser(): Promise<User | null> {
  return null;
}

export async function requireUser(): Promise<User | null> {
  return null;
}

export { getUserDisplayName, resolveDisplayNameFromSources };
