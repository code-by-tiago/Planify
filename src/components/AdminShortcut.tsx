"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminStatus = {
  authenticated: boolean;
  isAdmin: boolean;
  email?: string;
};

export function AdminShortcut() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/admin/status", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as AdminStatus;

        if (active) {
          setVisible(Boolean(data.authenticated && data.isAdmin));
        }
      } catch {
        if (active) {
          setVisible(false);
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
    >
      Admin
    </Link>
  );
}

export default AdminShortcut;
