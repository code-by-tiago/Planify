import { createClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createClient> | null = null;

function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }

  return value;
}

function getServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  return value;
}

export function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
