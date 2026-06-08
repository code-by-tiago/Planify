import type { ReactNode } from "react";
import { LandingFooter } from "@/components/public/landing-professor-primeiro/LandingFooter";
import { LandingHeader } from "@/components/public/landing-professor-primeiro/LandingHeader";
import { ppPage } from "@/components/public/landing-professor-primeiro/theme";

type PublicProfessorPrimeiroLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function PublicProfessorPrimeiroLayout({
  children,
  className = "",
}: PublicProfessorPrimeiroLayoutProps) {
  return (
    <main className={`${ppPage} ${className}`.trim()}>
      <LandingHeader />
      {children}
      <LandingFooter />
    </main>
  );
}

export default PublicProfessorPrimeiroLayout;
