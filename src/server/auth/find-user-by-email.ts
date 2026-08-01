import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = getSupabaseAdminClient();

  let page = 1;
  const perPage = 200;

  while (page <= 15) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}
