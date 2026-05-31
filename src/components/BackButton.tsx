"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackHref = "/dashboard",
  label = "Voltar",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={
        className ||
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
      }
      aria-label="Voltar para a página anterior"
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}

export default BackButton;
