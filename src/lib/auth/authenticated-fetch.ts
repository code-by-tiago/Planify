import { getCurrentAccessToken } from "./session-client";

/** Fetch autenticado: cookie de sessão + Bearer Supabase (fallback). */
export async function planifyAuthenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (
    init.body &&
    typeof init.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getCurrentAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
    cache: init.cache ?? "no-store",
  });
}
