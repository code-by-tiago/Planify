import { fetchPlanifyAccessStatus } from "./access-client";
import { ensurePremiumSessionCookies } from "./session-client";
import { waitForAccessToken } from "./wait-for-session";

export type ClientAccessSnapshot = {
  token: string | null;
  authenticated: boolean;
  premium: boolean;
  email?: string;
  message?: string;
};

export async function resolveClientPlanifyAccess(): Promise<ClientAccessSnapshot> {
  let token = await waitForAccessToken();

  try {
    await ensurePremiumSessionCookies();
  } catch {
    // Cookie sync may fail transiently; status API can still use Bearer token.
  }

  if (!token) {
    token = await waitForAccessToken(1500);
  }

  const data = await fetchPlanifyAccessStatus(token);

  return {
    token,
    authenticated: Boolean(data.authenticated),
    premium: Boolean(data.premium),
    email: data.email,
    message: data.message,
  };
}
