"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { BillingPlanKey } from "@/types/billing";

type PlanCheckoutLinkProps = {
  planKey: BillingPlanKey;
  className?: string;
  children: ReactNode;
};

/** Checkout Stripe com e-mail da sessão (liga assinatura à conta criada). */
export function PlanCheckoutLink({
  planKey,
  className,
  children,
}: PlanCheckoutLinkProps) {
  const [href, setHref] = useState(`/api/stripe/checkout?plan=${planKey}`);

  useEffect(() => {
    void getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        const email = data.session?.user?.email?.trim();
        if (!email) return;
        const params = new URLSearchParams({ plan: planKey, email });
        setHref(`/api/stripe/checkout?${params.toString()}`);
      });
  }, [planKey]);

  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
