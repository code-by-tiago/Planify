"use client";

import { useState } from "react";

type AdminLogoutButtonProps = {
  className?: string;
};

export function AdminLogoutButton({ className = "" }: AdminLogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function logoutAdmin() {
    setLoading(true);

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("planify_admin_tab_unlocked");
      }

      await fetch("/api/admin/session", {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Mesmo se a chamada falhar, remove a trava local e volta para o gate.
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/admin";
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
