import { getSupabaseBrowserClient } from "../supabase/browser-client";

/**
 * Waits for Supabase to hydrate the session from storage (common on mobile Safari
 * after a full navigation).
 */
export async function waitForAccessToken(timeoutMs = 4000): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: initial } = await supabase.auth.getSession();

  if (initial.session?.access_token) {
    return initial.session.access_token;
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (token: string | null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(token);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        finish(session.access_token);
      }
    });
  });
}
