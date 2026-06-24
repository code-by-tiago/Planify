import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { GOOGLE_FORMS_SCOPE, hasGoogleFormsScope } from "./google-config";
import { getGoogleTokensForUser, saveGoogleTokensForUser } from "./google-token-store";
import { refreshGoogleAccessToken } from "./google-oauth";

function agentDebugLog(message: string, data: Record<string, unknown>): void {
  try {
    appendFileSync(
      join(process.cwd(), "debug-a1058c.log"),
      `${JSON.stringify({
        sessionId: "a1058c",
        location: "google-forms-scope.ts",
        message,
        data,
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    // ignore
  }
}

export async function tokenInfoHasFormsScope(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { scope?: string; error?: string };
    const scopes = String(data.scope || "")
      .split(" ")
      .map((item) => item.trim())
      .filter(Boolean);

    return scopes.some(
      (scope) => scope === GOOGLE_FORMS_SCOPE || scope.includes("forms.body"),
    );
  } catch {
    return false;
  }
}

export async function resolveFormsScopeGrantedForUser(
  userId: string,
): Promise<{ formsScopeGranted: boolean; dbGranted: boolean; tokenGranted: boolean }> {
  const stored = await getGoogleTokensForUser(userId).catch(() => null);
  const dbGranted = hasGoogleFormsScope(stored?.scopes || []);

  if (!stored?.refreshToken) {
    return { formsScopeGranted: false, dbGranted: false, tokenGranted: false };
  }

  if (dbGranted) {
    return { formsScopeGranted: true, dbGranted: true, tokenGranted: true };
  }

  let accessToken = stored.accessToken;
  if (!accessToken) {
    try {
      const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
      accessToken = refreshed.access_token;
    } catch {
      return { formsScopeGranted: false, dbGranted: false, tokenGranted: false };
    }
  }

  const tokenGranted = accessToken ? await tokenInfoHasFormsScope(accessToken) : false;
  const formsScopeGranted = tokenGranted;

  // #region agent log
  agentDebugLog("resolveFormsScopeGranted", {
    hypothesisId: "C",
    dbGranted,
    tokenGranted,
    formsScopeGranted,
  });
  // #endregion

  if (tokenGranted && !dbGranted && stored) {
    const mergedScopes = [...new Set([...(stored.scopes || []), GOOGLE_FORMS_SCOPE])];
    try {
      const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
      await saveGoogleTokensForUser(userId, refreshed, {
        existingRefreshToken: stored.refreshToken,
        preserveScopes: mergedScopes,
        preserveGoogleEmail: stored.googleEmail,
      });
    } catch {
      // sync best-effort
    }
  }

  return { formsScopeGranted, dbGranted, tokenGranted };
}

export async function assertFormsScopeForExport(
  userId: string,
  accessToken: string,
): Promise<void> {
  const stored = await getGoogleTokensForUser(userId);
  const dbGranted = hasGoogleFormsScope(stored?.scopes || []);
  const tokenGranted = await tokenInfoHasFormsScope(accessToken);

  // #region agent log
  agentDebugLog("assertFormsScopeForExport", {
    hypothesisId: "C",
    dbGranted,
    tokenGranted,
  });
  // #endregion

  if (!dbGranted && !tokenGranted) {
    throw new Error(
      "Reconecte o Google e autorize o Google Forms (permissão forms.body).",
    );
  }
}
