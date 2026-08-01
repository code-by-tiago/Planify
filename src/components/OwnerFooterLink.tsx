"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchFullPlanifyAccessStatus } from "@/lib/auth/access-client";

type OwnerFooterLinkProps = {
  className?: string;
};

export function OwnerFooterLink({ className = "" }: OwnerFooterLinkProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkOwner() {
      try {
        const data = await fetchFullPlanifyAccessStatus();

        if (active) {
          setIsOwner(Boolean(data?.isOwner));
        }
      } catch {
        if (active) setIsOwner(false);
      } finally {
        if (active) setChecked(true);
      }
    }

    void checkOwner();

    return () => {
      active = false;
    };
  }, []);

  if (!checked || !isOwner) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className={`text-[10px] font-medium text-slate-600/40 transition hover:text-cyan-500/70 ${className}`}
      title="Administração do proprietário"
    >
      Administração
    </Link>
  );
}

export default OwnerFooterLink;
