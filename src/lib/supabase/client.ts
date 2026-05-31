import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../types/database";

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("As variáveis públicas do Supabase não foram configuradas.");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}