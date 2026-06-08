"use client";

import { LandingHeader } from "@/components/public/landing-professor-primeiro/LandingHeader";

type PublicHeaderProps = {
  active?: "home" | "planos" | "contato" | "ferramentas" | "como" | "escolas";
};

/** @deprecated Use LandingHeader or PublicProfessorPrimeiroLayout directly. */
export function PublicHeader(_props: PublicHeaderProps) {
  return <LandingHeader />;
}

export default PublicHeader;
