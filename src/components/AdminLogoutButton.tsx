"use client";

import { useState } from "react";
import { signOutPlanify } from "@/lib/auth/session-client";

type AdminLogoutButtonProps = {
  className?: string;
};

export function AdminLogoutButton({ className = "" }: AdminLogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function logoutAdmin() {
    setLoading(true);

    try {
      await signOutPlanify();
    } catch {
      // Mesmo se a chamada falhar, limpa caches locais e volta para o gate.
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
  }

  return (
    <button
      type="button"
      onClick={logoutAdmin}
      disabled={loading}
      className={
        className ||
        "rounded-2xl border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-black text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {loading ? "Saindo..." : "Sair Admin"}
    </button>
  );
}

export default AdminLogoutButton;
