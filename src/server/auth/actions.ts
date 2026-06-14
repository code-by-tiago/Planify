"use server";

import { redirect } from "next/navigation";

function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/dashboard";
  }

  if (raw === "/login" || raw === "/sair" || raw === "/logout") {
    return "/dashboard";
  }

  return raw;
}

/**
 * Compatibilidade para formulários/server actions antigos.
 *
 * O login real do Planify agora é feito no frontend em:
 * src/app/login/LoginPageClient.tsx
 *
 * Esta função existe para manter exports antigos sem quebrar o build.
 */
export async function signInWithPassword(formData: FormData) {
  const redirectTo = getSafeRedirectPath(formData.get("redirectTo"));

  redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
}

/**
 * Compatibilidade para cadastro antigo.
 *
 * O cadastro real do Planify agora é feito no frontend em:
 * src/app/login/LoginPageClient.tsx
 */
export async function signUpWithPassword() {
  redirect("/login?cadastro=ok");
}

/**
 * Sair sempre passa pela página /sair, que limpa Supabase + cookie premium
 * e volta automaticamente ao início.
 */
export async function signOut() {
  redirect("/sair");
}

export async function signIn() {
  redirect("/login");
}

export async function signUp() {
  redirect("/login");
}
