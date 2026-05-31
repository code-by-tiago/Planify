import type { PremiumAccessResult } from "../../types/access";

export type AccessCookieResponse = {
  success: boolean;
  access: PremiumAccessResult;
};

export async function checkPremiumAccess(accessToken: string): Promise<PremiumAccessResult> {
  const response = await fetch("/api/auth/access", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = (await response.json()) as {
    success: boolean;
    access: PremiumAccessResult;
  };

  return json.access;
}

export async function syncPremiumAccessCookie(
  accessToken: string,
): Promise<AccessCookieResponse> {
  const response = await fetch("/api/auth/access-cookie", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return (await response.json()) as AccessCookieResponse;
}

export async function clearPremiumAccessCookie(): Promise<void> {
  await fetch("/api/auth/access-cookie", {
    method: "DELETE",
  });
}
